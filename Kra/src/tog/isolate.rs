use std::path::{Path, PathBuf};
use tokio::process::Command;
use crate::tog::types::{BoxError, TestCaseResult, InputMode};
use crate::tog::run::compare_lenient;

pub struct IsolateManager;

impl IsolateManager {
    pub async fn init(box_id: u32) -> Result<PathBuf, BoxError> {
        println!("[ISOLATE] 🔄 Khởi tạo box_id: {}", box_id);
        let _ = Command::new("isolate")
            .args(["--cleanup", &format!("--box-id={}", box_id)])
            .output().await;

        let output = Command::new("isolate")
            .args(["--init", &format!("--box-id={}", box_id)])
            .output().await?;
        
        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(format!("Init failed: {}", err).into());
        }
        
        let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let box_path = PathBuf::from(path_str).join("box");
        println!("[ISOLATE] ✅ Box {} sẵn sàng tại: {:?}", box_id, box_path);
        Ok(box_path)
    }

    pub async fn cleanup(box_id: u32) -> Result<(), BoxError> {
        println!("[ISOLATE] 🧹 Dọn dẹp box_id: {}", box_id);
        let _ = Command::new("isolate").args(["--cleanup", &format!("--box-id={}", box_id)]).output().await;
        Ok(())
    }

    pub async fn compile_in_box(
        box_id: u32,
        src_path: &Path,
        is_cpp: bool,
    ) -> Result<PathBuf, BoxError> {
        let box_dir = Self::init(box_id).await?;
        let ext = if is_cpp { "cpp" } else { "c" };
        let internal_src = format!("source.{}", ext);
        let out_name = "prog.bin";

        println!("[COMPILE] 📦 Copy source vào Sandbox...");
        tokio::fs::copy(src_path, box_dir.join(&internal_src)).await?;

        let compiler = if is_cpp { "/usr/bin/g++" } else { "/usr/bin/gcc" };
        let std_flag = if is_cpp { "-std=c++17" } else { "-std=c11" };

        let output = Command::new("isolate")
            .args([
                &format!("--box-id={}", box_id),
                "--env=PATH=/usr/bin:/bin",
                "--mem=512000",
                "--time=30",
                "--processes=100",
                "--run", "--",
                compiler, std_flag, "-O2", &internal_src, "-o", out_name
            ])
            .output().await?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            eprintln!("[COMPILE ERR] ❌ Lỗi biên dịch:\n{}", err);
            return Err(format!("Compile error: {}", err).into());
        }

        Ok(box_dir.join(out_name))
    }

    pub async fn run_single_test_isolate(
        box_id: u32,
        submission_bin: &Path,
        checker_bin: Option<&Path>,
        input_path: &Path,
        answer_path: Option<&Path>,
        time_limit_ms: u64,
        memory_limit_kb: u64,
        input_mode: InputMode,
    ) -> TestCaseResult {
        let case_name = input_path.file_name().unwrap().to_string_lossy().to_string();
        println!("\n[RUN] >>> Case: {}", case_name);
        
        let run_res = Self::run_task_internal(
            box_id, submission_bin, input_path, 
            time_limit_ms, memory_limit_kb, input_mode
        ).await;
        
        let (stdout, mem, time, mut status) = match run_res {
            Ok(val) => val,
            Err(e) => {
                eprintln!("[RUN ERR] ❌ Lỗi: {}", e);
                return Self::quick_err_iso(case_name, -1);
            }
        };

        let mut passed = false;
        if status == 0 {
            if let Some(chk_bin) = checker_bin {
                passed = Self::run_checker_in_box(100, chk_bin, input_path, &stdout, answer_path.unwrap()).await.unwrap_or(false);
            } else if let Some(ans_p) = answer_path {
                if let Ok(expected) = tokio::fs::read(ans_p).await {
                    passed = compare_lenient(&stdout, &expected);
                }
            }
            status = if passed { 0 } else { 1 };
        }

        let _ = Self::cleanup(box_id).await;
        TestCaseResult {
            case_name, passed, time_ms: time,
            memory_kb: Some(mem), checker_exit_ok: true, stderr: Some(status),
        }
    }

    async fn run_task_internal(
        box_id: u32, 
        bin_path: &Path, 
        input_path: &Path, 
        time_limit_ms: u64, 
        memory_limit_kb: u64,
        input_mode: InputMode,
    ) -> Result<(Vec<u8>, u64, u128, i8), BoxError> {
        let box_dir = Self::init(box_id).await?;
        let meta_path = format!("/tmp/iso_{}.meta", box_id);
        let _ = tokio::fs::remove_file(&meta_path).await;

        tokio::fs::copy(bin_path, box_dir.join("solution")).await?;

        let file_stem = input_path.file_stem().unwrap().to_string_lossy().to_string();
        let input_filename = input_path.file_name().unwrap().to_string_lossy().to_string();
        let output_filename = format!("{}.out", file_stem);

        let mut cmd = Command::new("timeout");
        cmd.args(["--signal=KILL", "5s", "isolate", 
                  &format!("--box-id={}", box_id),
                  &format!("--time={}", time_limit_ms as f64 / 1000.0),
                  &format!("--meta={}", meta_path),
                  "--processes=1", 
                  "--run", "--", "./solution"]);

        match input_mode {
            InputMode::Stdin => {
                tokio::fs::copy(input_path, box_dir.join("input.txt")).await?;
                cmd.arg("--stdin=input.txt");
            }
            InputMode::File => {
                tokio::fs::copy(input_path, box_dir.join(&input_filename)).await?;
            }
        }

        println!("[EXEC] ⚡ Mode: {:?} | In: {} | Out: {}", input_mode, input_filename, output_filename);
        let output = cmd.output().await?;

        let final_stdout = match input_mode {
            InputMode::Stdin => output.stdout,
            InputMode::File => {
                let out_path = box_dir.join(&output_filename);
                if out_path.exists() {
                    tokio::fs::read(out_path).await.unwrap_or_default()
                } else {
                    Vec::new() 
                }
            }
        };

        let meta_content = tokio::fs::read_to_string(&meta_path).await.unwrap_or_default();
        let (mut time, mut mem, mut status) = (0, 0, 0);
        for line in meta_content.lines() {
            let p: Vec<&str> = line.split(':').collect();
            if p.len() < 2 { continue; }
            match p[0] {
                "time" => time = (p[1].parse::<f64>().unwrap_or(0.0) * 1000.0) as u128,
                "max-rss" => mem = p[1].parse::<u64>().unwrap_or(0),
                "status" => status = match p[1] { "TO" => 2, "RE" | "SG" => 4, _ => 1 },
                _ => {}
            }
        }
        
        if status == 0 && !output.status.success() { status = 4; }
        Ok((final_stdout, mem, time, status))
    }

    async fn run_checker_in_box(box_id: u32, chk_bin: &Path, inp_p: &Path, user_out: &[u8], ans_p: &Path) -> Result<bool, BoxError> {
        let box_dir = Self::init(box_id).await?;
        tokio::fs::copy(chk_bin, box_dir.join("checker")).await?;
        tokio::fs::copy(inp_p, box_dir.join("data.inp")).await?;
        tokio::fs::write(box_dir.join("user.out"), user_out).await?;
        tokio::fs::copy(ans_p, box_dir.join("data.res")).await?;

        let output = Command::new("isolate")
            .args([&format!("--box-id={}", box_id), "--run", "--", "./checker", "data.inp", "user.out", "data.res"])
            .output().await?;
        
        let res = String::from_utf8_lossy(&output.stdout).trim().starts_with('1');
        let _ = Self::cleanup(box_id).await;
        Ok(res)
    }

    fn quick_err_iso(case_name: String, code: i8) -> TestCaseResult {
        TestCaseResult {
            case_name, passed: false, time_ms: 0, memory_kb: None,
            checker_exit_ok: false, stderr: Some(code),
        }
    }
}