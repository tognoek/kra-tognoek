mod fetch;
mod run;
mod types;

use tokio::fs;

pub use types::{BoxError, ExecResult, JobConfig, InputMode, Language, exec_name};
use fetch::{collect_testcases, download_bundle, find_checker, find_code_file, unzip_bundle};
use run::{compile_cpp, compile_c, run_single_test};

pub struct Executor;

impl Executor {
    pub async fn run_job(cfg: JobConfig) -> Result<ExecResult, BoxError> {
        let temp = tempfile::tempdir()?;
        let bundle_path = temp.path().join("bundle.zip");

        download_bundle(&cfg, &bundle_path).await
            .map_err(|e| {
                eprintln!("[ERROR] Lỗi tải bundle từ S3: {}", e);
                e
            })?;

        unzip_bundle(&bundle_path, temp.path())
            .map_err(|e| {
                eprintln!("[ERROR] Lỗi giải nén bundle: {}", e);
                e
            })?;

        let code_path = find_code_file(temp.path(), &cfg.id)
            .map_err(|e| {
                eprintln!("[ERROR] Find code failed: {}", e);
                e 
            })?;

        let checker_path = find_checker(temp.path());
        if let Some(ref cp) = checker_path {
        } else {
            eprintln!("[WARNING] Find code check failed");
        }

        let bin_dir = temp.path().join("bin");
        fs::create_dir_all(&bin_dir).await?;
        let submission_bin = bin_dir.join(exec_name("submission"));
        let mut compile_log = String::new();
        match cfg.language {
            Language::C => {
                compile_c(&code_path, &submission_bin, &mut compile_log).await
                    .map_err(|e| {
                        eprintln!("[ERROR] Lỗi biên dịch code C thí sinh: {}", e);
                        e
                    })?;
            }
            Language::Cpp => {
                compile_cpp(&code_path, &submission_bin, &mut compile_log).await
                    .map_err(|e| {
                        eprintln!("[ERROR] Lỗi biên dịch code C++ thí sinh: {}", e);
                        e
                    })?;
            }
        }

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

