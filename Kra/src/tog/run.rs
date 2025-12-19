//! Phần biên dịch và thực thi test / checker.

use std::path::Path;
use std::time::Instant;

use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

use crate::tog::types::{BoxError, TestCaseResult, InputMode};

/// Biên dịch file cpp thành binary.
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

/// Chạy 1 test case; nếu có checker thì dùng checker, nếu không thì so sánh stdout với answer.
pub async fn run_single_test(
    submission_bin: &Path,
    checker_bin: Option<&Path>,
    input_path: &Path,
    answer_path: Option<&Path>,
    time_limit_ms: u64,
    _memory_limit_kb: u64,
    input_mode: InputMode,
) -> TestCaseResult {
    let case_name = input_path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let mut passed = false;
    let mut checker_exit_ok = false;
    let mut stderr_log = None;
    let mut time_ms = 0u128;
    let memory_kb = None; // đo RAM có thể bổ sung sau

    // Đọc input (chỉ khi chạy ở mode stdin)
    let input_data = if let InputMode::Stdin = input_mode {
        match tokio::fs::read(input_path).await {
            Ok(d) => Some(d),
            Err(e) => {
                stderr_log = Some(format!("Không đọc được input: {}", e));
                return TestCaseResult {
                    case_name,
                    passed,
                    time_ms,
                    memory_kb,
                    checker_exit_ok,
                    stderr: stderr_log,
                };
            }
        }
    } else {
        None
    };

    // Chạy binary thí sinh
    let start = Instant::now();
    let run = async {
        let mut cmd = Command::new(submission_bin);

        // Nếu bài đọc từ stdin => pipe input, ngược lại để stdin mặc định.
        if let InputMode::Stdin = input_mode {
            cmd.stdin(std::process::Stdio::piped());
        }

        let mut child = match cmd
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                return Err(format!("Không chạy được binary: {}", e));
            }
        };

        // ghi stdin nếu dùng mode stdin
        if let (InputMode::Stdin, Some(data)) = (input_mode.clone(), input_data) {
            if let Some(mut stdin) = child.stdin.take() {
                if let Err(e) = stdin.write_all(&data).await {
                    return Err(format!("Ghi stdin lỗi: {}", e));
                }
            }
        }

        let output = child.wait_with_output().await.map_err(|e| e.to_string())?;
        Ok(output)
    };

    let output = match timeout(Duration::from_millis(time_limit_ms), run).await {
        Ok(result) => match result {
            Ok(o) => o,
            Err(e) => {
                stderr_log = Some(e);
                return TestCaseResult {
                    case_name,
                    passed,
                    time_ms,
                    memory_kb,
                    checker_exit_ok,
                    stderr: stderr_log,
                };
            }
        },
        Err(_) => {
            stderr_log = Some("Timeout".to_string());
            return TestCaseResult {
                case_name,
                passed,
                time_ms,
                memory_kb,
                checker_exit_ok,
                stderr: stderr_log,
            };
        }
    };
    time_ms = start.elapsed().as_millis();

    // Nếu có checker, chạy checker
    if let Some(checker) = checker_bin {
        if let Some(ans) = answer_path {
            // Tạo file [mã test-sv].out cùng thư mục với file input
            let stem = input_path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "user".to_string());
            let user_out_name = format!("{stem}-sv.out");
            let user_out_path = input_path.with_file_name(user_out_name);
            if let Err(e) = tokio::fs::write(&user_out_path, &output.stdout).await {
                stderr_log = Some(format!("Ghi user.out lỗi: {}", e));
                return TestCaseResult {
                    case_name,
                    passed,
                    time_ms,
                    memory_kb,
                    checker_exit_ok,
                    stderr: stderr_log,
                };
            }

            let checker_run = Command::new(checker)
                .arg(input_path)
                .arg(&user_out_path)
                .arg(ans)
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .output()
                .await;

            match checker_run {
                Ok(co) => {
                    checker_exit_ok = co.status.success();

                    // Diễn giải kết quả checker: in ra "0" hoặc "1" trên stdout.
                    // 1 = đúng, 0 = sai. Các trường hợp khác coi là sai và ghi vào stderr.
                    let stdout_str = String::from_utf8_lossy(&co.stdout);
                    let token = stdout_str.split_whitespace().next().unwrap_or("");
                    match token {
                        "1" => {
                            passed = true;
                        }
                        "0" => {
                            passed = false;
                        }
                        _ => {
                            passed = false;
                            let err = format!(
                                "Checker output không hợp lệ (mong đợi '0' hoặc '1'): {:?}",
                                stdout_str
                            );
                            stderr_log = Some(err);
                        }
                    }

                    // Nếu exit code != 0, lưu thêm stderr nếu có (để debug).
                    if !checker_exit_ok {
                        let err = String::from_utf8_lossy(&co.stderr).to_string();
                        if !err.is_empty() {
                            stderr_log = Some(err);
                        }
                    }
                }
                Err(e) => {
                    stderr_log = Some(format!("Chạy checker lỗi: {}", e));
                }
            }
        } else {
            stderr_log = Some("Thiếu file answer cho checker".to_string());
        }
    } else {
        // So sánh trực tiếp với answer nếu có
        if let Some(ans) = answer_path {
            match tokio::fs::read(ans).await {
                Ok(expected) => {
                    passed = output.stdout == expected;
                    if !passed && output.status.success() {
                        let diff = format!(
                            "Output khác answer. stdout len={} answer len={}",
                            output.stdout.len(),
                            expected.len()
                        );
                        stderr_log = Some(diff);
                    }
                }
                Err(e) => stderr_log = Some(format!("Không đọc được answer: {}", e)),
            }
        } else {
            // Không có answer -> coi như pass nhưng báo thiếu answer
            passed = true;
            stderr_log = Some("Không có file answer (.out) để so sánh".to_string());
        }
    }

    TestCaseResult {
        case_name,
        passed,
        time_ms,
        memory_kb,
        checker_exit_ok,
        stderr: stderr_log,
    }
}

