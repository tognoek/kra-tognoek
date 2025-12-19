#![allow(dead_code)]

//! Điều phối: gọi phần tải/giải nén (fetch) và phần biên dịch/chạy test (run).

mod fetch;
mod run;
mod types;

use tokio::fs;

pub use types::{BoxError, ExecResult, JobConfig, InputMode, exec_name};
use fetch::{collect_testcases, download_bundle, find_checker, find_code_file, unzip_bundle};
use run::{compile_cpp, run_single_test};

pub struct Executor;

impl Executor {
    /// Thực thi toàn bộ luồng: tải zip từ S3, giải nén, biên dịch, chạy test.
    pub async fn run_job(cfg: JobConfig) -> Result<ExecResult, BoxError> {
        let temp = tempfile::tempdir()?;
        let bundle_path = temp.path().join("bundle.zip");

        // 1) Tải zip từ S3
        download_bundle(&cfg, &bundle_path).await
            .map_err(|e| {
                eprintln!("[ERROR] Lỗi tải bundle từ S3: {}", e);
                e
            })?;

        // 2) Giải nén
        unzip_bundle(&bundle_path, temp.path())
            .map_err(|e| {
                eprintln!("[ERROR] Lỗi giải nén bundle: {}", e);
                e
            })?;

        // 3) Tìm file code & checker
        let code_path = find_code_file(temp.path(), &cfg.id)
            .map_err(|e| {
                eprintln!("[ERROR] Không tìm thấy file code: {}", e);
                if let Ok(entries) = std::fs::read_dir(temp.path()) {
                    for entry in entries.flatten() {
                        if let Ok(path) = entry.path().canonicalize() {
                            if path.extension().and_then(|s| s.to_str()) == Some("cpp") {
                                eprintln!("  - {:?}", path);
                            }
                        }
                    }
                }
                e
            })?;

        let checker_path = find_checker(temp.path());
        if let Some(ref cp) = checker_path {
        } else {
        }

        // 4) Biên dịch code thí sinh
        let bin_dir = temp.path().join("bin");
        fs::create_dir_all(&bin_dir).await?;
        let submission_bin = bin_dir.join(exec_name("submission"));
        let mut compile_log = String::new();
        compile_cpp(&code_path, &submission_bin, &mut compile_log).await
            .map_err(|e| {
                eprintln!("[ERROR] Lỗi biên dịch code thí sinh: {}", e);
                e
            })?;

        // 5) Biên dịch checker nếu có
        let checker_bin = if let Some(checker_src) = checker_path {
            let path = bin_dir.join(exec_name("checker"));
            compile_cpp(&checker_src, &path, &mut compile_log).await
                .map_err(|e| {
                    eprintln!("[ERROR] Lỗi biên dịch checker: {}", e);
                    e
                })?;
            Some(path)
        } else {
            None
        };

        // 6) Thu thập test cases (.inp)
        let test_cases = collect_testcases(temp.path())
            .map_err(|e| {
                eprintln!("[ERROR] Lỗi thu thập test cases: {}", e);
                if let Ok(entries) = std::fs::read_dir(temp.path()) {
                    for entry in entries.flatten().take(10) {
                        eprintln!("  - {:?}", entry.path());
                    }
                }
                e
            })?;
        for (idx, (inp, ans)) in test_cases.iter().enumerate() {
            println!("  Test {}: input={:?}, answer={:?}", idx + 1, inp, ans);
        }

        if test_cases.is_empty() {
            return Err("Không tìm thấy test case nào (.inp files)".into());
        }

        // 7) Chạy từng test
        let mut results = Vec::new();
        for (idx, (inp, ans)) in test_cases.iter().enumerate() {
            let res = run_single_test(
                &submission_bin,
                checker_bin.as_ref().map(|v| v.as_path()),
                inp,
                ans.as_ref().map(|v| v.as_path()),
                cfg.time_limit_ms,
                cfg.memory_limit_kb,
                cfg.input_mode.clone(),
            )
            .await;
            results.push(res);
        }

        Ok(ExecResult {
            compile_ok: true,
            compile_log,
            tests: results,
        })
    }
}

