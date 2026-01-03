use std::path::{Path, PathBuf};
use tokio::process::Command;
use tokio::time::{timeout, Duration};
use crate::tog::types::{BoxError, TestCaseResult, InputMode};

pub struct IsolateManager;

impl IsolateManager {
    pub async fn init(box_id: u32) -> Result<PathBuf, BoxError> {
        let _ = timeout(Duration::from_secs(2), 
            Command::new("isolate").args(["--cleanup", &format!("--box-id={}", box_id)]).output()
        ).await;

        let output = Command::new("isolate").args(["--init", &format!("--box-id={}", box_id)]).output().await?;
        let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(PathBuf::from(path_str).join("box"))
    }

    pub async fn cleanup(box_id: u32) -> Result<(), BoxError> {
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
        let output = Command::new("isolate")
            .args([&format!("--box-id={}", box_id), "--env=PATH=/usr/bin:/bin", "--mem=512000", "--time=30", "--processes=100", "--run", "--", compiler, "-std=c++17", "-O2", &internal_src, "-o", out_name])
            .output().await?;

        if !output.status.success() {
            return Err(format!("Compile error: {}", String::from_utf8_lossy(&output.stderr)).into());
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
        let stem = input_path.file_stem().unwrap().to_string_lossy();
        let box_dir = match Self::init(box_id).await {
            Ok(p) => p,
            Err(_) => return Self::quick_err_iso(stem.to_string(), -1),
        };

        let internal_bin = box_dir.join("solution");
        let _ = tokio::fs::copy(submission_bin, &internal_bin).await;

        let mut cmd = Command::new("isolate");
        cmd.args([
            &format!("--box-id={}", box_id),
            &format!("--time={}", time_limit_ms as f64 / 1000.0),
            &format!("--wall-time={}", (time_limit_ms as f64 / 1000.0) * 3.0 + 2.0),
            &format!("--mem={}", memory_limit_kb),
            &format!("--meta={}", "meta.txt"),
            "--processes=64",
            "--run", "--", "./solution"
        ]);

        // CHỈNH SỬA QUAN TRỌNG TẠI ĐÂY:
        // Sử dụng cơ chế Pipe của Rust để tránh Isolate bị treo khi tự mở file
        use std::process::Stdio;
        let internal_out_name = format!("{}.out", stem);
        let user_out_external = input_path.with_file_name(&internal_out_name);

        match input_mode {
            InputMode::Stdin => {
                // Mở file input từ máy chủ thật và đổ vào stdin của isolate
                let input_file = std::fs::File::open(input_path).map_err(|_| "Không mở được input").unwrap();
                cmd.stdin(Stdio::from(input_file));
                
                // Hứng stdout của isolate và ghi vào file thật
                let output_file = std::fs::File::create(&user_out_external).map_err(|_| "Không tạo được output").unwrap();
                cmd.stdout(Stdio::from(output_file));
            },
            InputMode::File => {
                let inp_name = format!("{}.inp", stem);
                let _ = tokio::fs::copy(input_path, box_dir.join(&inp_name)).await;
                cmd.stdin(Stdio::null()); // Khóa stdin
                // Chế độ file thì không chuyển hướng stdout, thí sinh tự tạo file .out trong box
            }
        }

        // Chạy và chờ
        let _ = timeout(Duration::from_millis(time_limit_ms * 3 + 5000), cmd.status()).await;

        // --- ĐỌC KẾT QUẢ ---
        let meta_content = tokio::fs::read_to_string(box_dir.join("meta.txt")).await.unwrap_or_default();
        println!("[DEBUG] Metadata content: \n{}", meta_content);
        let (time, mem, mut status) = Self::parse_meta(&meta_content);

        if let InputMode::File = input_mode {
            let out_in_box = box_dir.join(&internal_out_name);
            if out_in_box.exists() {
                let _ = tokio::fs::copy(out_in_box, &user_out_external).await;
            } else {
                let _ = tokio::fs::write(&user_out_external, "").await;
            }
        }

        // Kiểm tra nội dung file output đã copy/ghi ra ngoài
        if let Ok(c) = tokio::fs::read_to_string(&user_out_external).await {
            println!("[DEBUG] User Output Preview: {:?}", if c.len() > 50 { &c[..50] } else { &c });
        }

        let mut passed = false;
        if status == 0 {
            if let (Some(chk), Some(ans)) = (checker_bin, answer_path) {
                let chk_res = timeout(Duration::from_secs(5),
                    Command::new(chk).args([input_path, &user_out_external, ans]).output()
                ).await;
                if let Ok(Ok(out)) = chk_res {
                    let res_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    passed = res_str == "1" || res_str.to_lowercase() == "right";
                }
            }
            status = if passed { 0 } else { 1 };
        }

        let _ = Self::cleanup(box_id).await;

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
                    s = match p[1] { 
                        "TO" => 2, // TLE
                        "RE" | "SG" => 4, // RE
                        _ => 1 // WA hoặc lỗi khác
                    };
                },
                "exitcode" => exit_code = p[1].parse::<i32>().unwrap_or(0),
                _ => {}
            }
        }
        // Nếu không có status lạ mà exitcode khác 0 thì coi là RE
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