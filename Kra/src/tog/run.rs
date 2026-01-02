//! Phần biên dịch và thực thi test / checker.

use std::path::Path;

use std::time::{Duration, Instant};

use std::process::Stdio;

use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::time::timeout;

use crate::tog::types::{BoxError, TestCaseResult, InputMode};

pub async fn compile_cpp(src: &Path, out_bin: &Path, log: &mut String) -> Result<(), BoxError> {
    tokio::fs::create_dir_all(
        out_bin
            .parent()
            .ok_or_else(|| "binary path missing parent")?,
    )
    .await?;

    let mut cmd = Command::new("g++");
    cmd.arg("-std=c++17")
        .arg("-O2")
        .arg(src)
        .arg("-o")
        .arg(out_bin);

    let output = cmd.output().await?;
    log.push_str(&format!(
        "Compile {} -> {:?}\nstatus: {:?}\nstdout:\n{}\nstderr:\n{}\n",
        src.display(),
        out_bin,
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    ));

    if !output.status.success() {
        return Err(format!("Compile failed for {}", src.display()).into());
    }
    Ok(())
}

pub async fn compile_c(src: &Path, out_bin: &Path, log: &mut String) -> Result<(), BoxError> {
    tokio::fs::create_dir_all(
        out_bin
            .parent()
            .ok_or_else(|| "binary path missing parent")?,
    )
    .await?;

    let mut cmd = Command::new("gcc");
    cmd.arg("-std=c11")
        .arg("-O2")
        .arg(src)
        .arg("-o")
        .arg(out_bin);

    let output = cmd.output().await?;
    log.push_str(&format!(
        "Compile C {} -> {:?}\nstatus: {:?}\nstdout:\n{}\nstderr:\n{}\n",
        src.display(),
        out_bin,
        output.status.code(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    ));

    if !output.status.success() {
        return Err(format!("Compile C failed for {}", src.display()).into());
    }
    Ok(())
}

async fn get_memory_usage(pid: u32) -> Option<u64> {
    let path = format!("/proc/{}/status", pid);
    match tokio::fs::read_to_string(path).await {
        Ok(content) => {
            for line in content.lines() {
                if line.starts_with("VmRSS:") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        // parts[1] là số, ví dụ "1024"
                        return parts[1].parse::<u64>().ok();
                    }
                }
            }
            None
        },
        Err(_) => None,
    }
}

pub async fn run_single_test(
    submission_bin: &Path,
    checker_bin: Option<&Path>,
    input_path: &Path,
    answer_path: Option<&Path>,
    time_limit_ms: u64,
    memory_limit_kb: u64,
    input_mode: InputMode,
) -> TestCaseResult {
    let stem = input_path.file_stem().unwrap().to_string_lossy().to_string();
    let case_name = input_path.file_name().unwrap().to_string_lossy().to_string();
    
    // - Input: [name].inp
    // - User Output: [name].out (Thí sinh ghi hoặc hệ thống ghi dùm)
    // - Expected Output: [name].res (Đáp án chuẩn)
    let user_out_path = input_path.with_file_name(format!("{}.out", stem));
    
    let mut passed = false;
    let mut checker_exit_ok = false;
    let mut stderr_log: i8 = 0;
    let mut time_ms = 0u128;
    let memory_kb = None; 
    let input_data = if let InputMode::Stdin = input_mode {
        match tokio::fs::read(input_path).await {
            Ok(d) => Some(d),
            Err(e) => return quick_err(case_name, -1),
        }
    } else { None };

    let start = Instant::now();
    let run_process = async {
        let res: Result<(std::process::Output, u64), String> = {
            let mut cmd = Command::new(submission_bin);
            
            if let InputMode::Stdin = input_mode {
                cmd.stdin(Stdio::piped());
            } else {
                cmd.stdin(Stdio::null()); 
            }

            cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

            let mut child = cmd.spawn().map_err(|e| format!("Không chạy được binary: {}", e))?;
            let pid = child.id().ok_or("Không lấy được PID")?;
            
            if let (InputMode::Stdin, Some(data)) = (input_mode, input_data) {
                if let Some(mut stdin) = child.stdin.take() {
                    stdin.write_all(&data).await.map_err(|e| format!("Lỗi ghi stdin: {}", e))?;
                }
            }

            use std::sync::atomic::{AtomicU64, Ordering};
            use std::sync::Arc;
            
            let max_ram = Arc::new(AtomicU64::new(0));
            let max_ram_clone = max_ram.clone();
            
            let monitor_task = tokio::spawn(async move {
                loop {
                    if let Some(mem) = get_memory_usage(pid).await {
                        let current_max = max_ram_clone.load(Ordering::Relaxed);
                        if mem > current_max {
                            max_ram_clone.store(mem, Ordering::Relaxed);
                        }
                    } else {
                        break; 
                    }
                    tokio::time::sleep(Duration::from_millis(10)).await;
                }
            });

            let output = child.wait_with_output().await.map_err(|e| e.to_string())?;
            monitor_task.abort();

            let final_mem = max_ram.load(Ordering::Relaxed);
            Ok((output, final_mem))
        };
        res
    };

    let (output, measured_mem) = match timeout(Duration::from_millis(time_limit_ms), run_process).await {
        Ok(res) => match res {
            Ok(val) => val,
            Err(e) => return quick_err(case_name, -1),
        },
        Err(_) => {
            return TestCaseResult {
                case_name, passed: false, time_ms: time_limit_ms as u128, 
                memory_kb, checker_exit_ok: false, stderr: Some(2)
            };
        }
    };

    let memory_kb = if measured_mem > 0 { Some(measured_mem) } else { None };

    time_ms = start.elapsed().as_millis();

    let user_output_content = match input_mode {
        InputMode::Stdin => {
            if let Err(e) = tokio::fs::write(&user_out_path, &output.stdout).await {
                return quick_err(case_name, -1);
            }
            output.stdout
        },
        InputMode::File => {
            if !user_out_path.exists() {
                let _ = tokio::fs::write(&user_out_path, "").await;
                Vec::new() 
            } else {
                tokio::fs::read(&user_out_path).await.unwrap_or_default()
            }
        }
    };

    if let Some(checker) = checker_bin {
        if let Some(res_path) = answer_path {
            let chk_out = Command::new(checker)
                .arg(input_path)     // Arg 1: Input
                .arg(&user_out_path) // Arg 2: User Output
                .arg(res_path)       // Arg 3: Expected Output
                .stdout(Stdio::piped()).stderr(Stdio::piped())
                .output().await;

            match chk_out {
                Ok(co) => {
                    checker_exit_ok = co.status.success();
                    let out_str = String::from_utf8_lossy(&co.stdout);
                    passed = false;
                    if out_str.trim().starts_with("1") { 
                        passed = true; 
                    }
                    stderr_log = if passed { 0 } else { 1 };
                },
                Err(e) => stderr_log = -1,
            }
        } else {
            stderr_log = -1;
        }
    } else {
        if let Some(res_path) = answer_path {
            match tokio::fs::read(res_path).await {
                Ok(expected_content) => {
                    passed = compare_lenient(&user_output_content, &expected_content);
                    stderr_log = if passed { 0 } else { 1 };
                },
                Err(e) => stderr_log = -1,
            }
        } else {
            passed = true;
            stderr_log = 0;
        }
    }

    if let Some(mem) = memory_kb {
        if mem > memory_limit_kb { passed = false; stderr_log = 3; }
    }

    TestCaseResult {
        case_name, passed, time_ms, memory_kb, checker_exit_ok, stderr: Some(stderr_log),
    }
}

pub fn compare_lenient(user_bytes: &[u8], expected_bytes: &[u8]) -> bool {
    let user_str = String::from_utf8_lossy(user_bytes);
    let expected_str = String::from_utf8_lossy(expected_bytes);

    let mut u_lines: Vec<&str> = user_str.lines().map(|l| l.trim_end()).collect();
    let mut e_lines: Vec<&str> = expected_str.lines().map(|l| l.trim_end()).collect();

    while let Some(last) = u_lines.last() {
        if last.is_empty() { u_lines.pop(); } else { break; }
    }
    while let Some(last) = e_lines.last() {
        if last.is_empty() { e_lines.pop(); } else { break; }
    }

    if u_lines.len() != e_lines.len() {
        return false;
    }

    for (u, e) in u_lines.iter().zip(e_lines.iter()) {
        if u != e {
            return false;
        }
    }

    true
}

fn quick_err(case_name: String, err: i8) -> TestCaseResult {
    TestCaseResult {
        case_name, passed: false, time_ms: 0, memory_kb: None, 
        checker_exit_ok: false, stderr: Some(err)
    }
}

