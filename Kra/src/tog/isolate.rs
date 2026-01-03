use std::path::{Path, PathBuf};
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use crate::tog::types::{BoxError, TestCaseResult, InputMode};

pub struct IsolateManager;

impl IsolateManager {
    // Hàm tiện ích để kiểm tra trạng thái debug
    fn is_debug() -> bool {
        std::env::var("DEBUG").unwrap_or_default() == "true"
    }

    // Hàm in log có điều kiện và màu sắc
    fn log(msg: &str, color: &str) {
        if Self::is_debug() {
            // \x1b[...m là ANSI escape codes để in màu trên terminal
            println!("\x1b[{}m[ISOLATE] {}\x1b[0m", color, msg);
        }
    }

    pub async fn init(box_id: u32) -> Result<PathBuf, BoxError> {
        Self::log(&format!("Initializing box-id: {}", box_id), "34"); // Blue
        
        let _ = timeout(Duration::from_secs(2), 
            Command::new("isolate").args(["--cleanup", &format!("--box-id={}", box_id)]).output()
        ).await;

        let output = Command::new("isolate").args(["--init", &format!("--box-id={}", box_id)]).output().await?;
        let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let p = PathBuf::from(path_str).join("box");
        
        Self::log(&format!("Box path: {:?}", p), "32"); // Green
        Ok(p)
    }

    pub async fn cleanup(box_id: u32) -> Result<(), BoxError> {
        Self::log(&format!("Cleaning up box-id: {}", box_id), "33"); // Yellow
        let _ = Command::new("isolate").args(["--cleanup", &format!("--box-id={}", box_id)]).output().await;
        Ok(())
    }

    pub async fn compile_in_box(box_id: u32, src_path: &Path, is_cpp: bool) -> Result<PathBuf, BoxError> {
        let box_dir = Self::init(box_id).await?;
        let ext = if is_cpp { "cpp" } else { "c" };
        let internal_src = format!("source.{}", ext);
        let out_name = "prog.bin";
        tokio::fs::copy(src_path, box_dir.join(&internal_src)).await?;

        let compiler = if is_cpp { "/usr/bin/g++" } else { "/usr/bin/gcc" };
        Self::log(&format!("Compiling source with {}", compiler), "36"); // Cyan

        let output = Command::new("isolate")
            .args([
                &format!("--box-id={}", box_id), 
                "--env=PATH=/usr/bin:/bin", 
                "--mem=1024000", 
                "--time=30", 
                "--processes=200", 
                "--run", "--", 
                compiler, "-std=c++17", "-O2", &internal_src, "-o", out_name, "-lm"
            ])
            .output().await?;

        if !output.status.success() {
            let err_msg = String::from_utf8_lossy(&output.stderr);
            Self::log(&format!("Compile Error: {}", err_msg), "31"); // Red
            return Err(format!("Compile error: {}", err_msg).into());
        }
        
        Self::log("Compilation successful", "32");
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
        let stem = input_path.file_stem().unwrap().to_string_lossy();
        Self::log(&format!("Starting testcase: {}", stem), "35"); // Magenta

        let box_dir = match Self::init(box_id).await {
            Ok(p) => p,
            Err(e) => {
                Self::log(&format!("Init Error: {:?}", e), "31");
                return Self::quick_err_iso(stem.to_string(), -1);
            }
        };

        let internal_bin = box_dir.join("solution");
        let _ = tokio::fs::copy(submission_bin, &internal_bin).await;

        let meta_path = PathBuf::from(format!("/tmp/isolate_meta_{}.txt", box_id));
        let meta_path_str = meta_path.to_string_lossy().to_string();
        let _ = tokio::fs::remove_file(&meta_path).await;

        let mut cmd = Command::new("isolate");
        cmd.args([
            &format!("--box-id={}", box_id),
            &format!("--time={}", time_limit_ms as f64 / 1000.0),
            &format!("--wall-time={}", (time_limit_ms as f64 / 1000.0) * 3.0 + 2.0),
            &format!("--mem={}", memory_limit_kb),
            &format!("--meta={}", meta_path_str),
            &format!("--fsize={}", 10240),
            "--processes=64",
            "--env=PATH=/usr/bin:/bin",
            "--silent",
            "--run", "--", "./solution"
        ]);

        use std::process::Stdio;
        let internal_out_name = format!("{}.out", stem);
        let user_out_external = input_path.with_file_name(&internal_out_name);

        match input_mode {
            InputMode::Stdin => {
                let input_file = std::fs::File::open(input_path).unwrap();
                cmd.stdin(Stdio::from(input_file));
                let output_file = std::fs::File::create(&user_out_external).unwrap();
                cmd.stdout(Stdio::from(output_file));
            },
            InputMode::File => {
                let inp_name = format!("{}.inp", stem);
                let _ = tokio::fs::copy(input_path, box_dir.join(&inp_name)).await;
                cmd.stdin(Stdio::null());
            }
        }

        let run_status = timeout(Duration::from_millis(time_limit_ms * 3 + 5000), cmd.status()).await;
        Self::log(&format!("Execution finished with status: {:?}", run_status), "34");

        let mut meta_content = String::new();
        for i in 1..=5 {
            if let Ok(content) = tokio::fs::read_to_string(&meta_path).await {
                if !content.trim().is_empty() {
                    meta_content = content;
                    break;
                }
            }
            Self::log(&format!("Meta file empty, retrying {}/5...", i), "33");
            tokio::time::sleep(Duration::from_millis(100)).await;
        }

        let (time, mem, mut status) = Self::parse_meta(&meta_content);
        Self::log(&format!("Meta Result - Time: {}ms, Mem: {}kb, Status: {}", time, mem, status), "32");

        if let InputMode::File = input_mode {
            let out_in_box = box_dir.join(&internal_out_name);
            if out_in_box.exists() {
                let _ = tokio::fs::copy(out_in_box, &user_out_external).await;
            }
        }

        // --- DEBUG OUTPUT ---
        if Self::is_debug() {
            if let Ok(user_output_data) = tokio::fs::read_to_string(&user_out_external).await {
                println!("\x1b[90m---------- [USER OUTPUT: {}] ----------", stem);
                println!("{}", user_output_data.trim());
                println!("--------------------------------------\x1b[0m");
            }
        }

        let mut passed = false;
        if status == 0 {
            if let (Some(chk), Some(ans)) = (checker_bin, answer_path) {
                Self::log("Running checker...", "36");
                let chk_res = timeout(Duration::from_secs(5),
                    Command::new(chk).args([input_path, &user_out_external, ans]).output()
                ).await;
                
                if let Ok(Ok(out)) = chk_res {
                    let res_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    Self::log(&format!("Checker output: {}", res_str), "36");
                    passed = res_str == "1" || res_str.to_lowercase() == "true";
                }
            }
            status = if passed { 0 } else { 1 };
        }

        let _ = Self::cleanup(box_id).await;
        let _ = tokio::fs::remove_file(&meta_path).await;

        TestCaseResult {
            case_name: stem.to_string(), passed, time_ms: time,
            memory_kb: Some(mem), checker_exit_ok: true, stderr: Some(status),
        }
    }

    fn parse_meta(content: &str) -> (u128, u64, i8) {
        let (mut t, mut m, mut s) = (0, 0, 0);
        let mut exit_code = 0;
        let mut has_status = false;

        for line in content.lines() {
            let p: Vec<&str> = line.split(':').collect();
            if p.len() < 2 { continue; }
            match p[0] {
                "time" => t = (p[1].parse::<f64>().unwrap_or(0.0) * 1000.0) as u128,
                "max-rss" => m = p[1].parse::<u64>().unwrap_or(0),
                "status" => {
                    has_status = true;
                    s = match p[1] { "TO" => 2, "RE" | "SG" => 4, _ => 1 };
                },
                "exitcode" => exit_code = p[1].parse::<i32>().unwrap_or(0),
                _ => {}
            }
        }
        if !has_status && exit_code != 0 { s = 4; }
        (t, m, s)
    }

    fn quick_err_iso(case_name: String, code: i8) -> TestCaseResult {
        TestCaseResult {
            case_name, passed: false, time_ms: 0, memory_kb: None,
            checker_exit_ok: false, stderr: Some(code),
        }
    }
}