mod fetch;
pub mod run; // Để public hàm compare_lenient cho isolate.rs
mod types;
mod isolate; // Khai báo module con mới

use tokio::fs;
use std::path::Path;
pub use types::{BoxError, ExecResult, JobConfig, InputMode, Language, exec_name, TestCaseResult};
use fetch::{collect_testcases, download_bundle, find_checker, find_code_file, unzip_bundle};
use run::{compile_cpp, compile_c, run_single_test};
use isolate::IsolateManager;

pub struct Executor;

impl Executor {
    pub async fn run_job(cfg: JobConfig) -> Result<ExecResult, BoxError> {
        let temp = tempfile::tempdir()?;
        let bundle_path = temp.path().join("bundle.zip");
        let use_isolate = std::env::var("USE_ISOLATE").unwrap_or_default() == "true";
        let is_debug = std::env::var("DEBUG").unwrap_or_default() == "true";

        if is_debug {
            println!("\x1b[1;35m🚀 [EXECUTOR] Bắt đầu Job ID: {} (Isolate: {})\x1b[0m", cfg.id, use_isolate);
        }

        // 1. Chuẩn bị tài nguyên
        download_bundle(&cfg, &bundle_path).await?;
        unzip_bundle(&bundle_path, temp.path())?;

        let code_path = find_code_file(temp.path(), &cfg.id)?;
        let checker_path = find_checker(temp.path());
        let bin_dir = temp.path().join("bin");
        fs::create_dir_all(&bin_dir).await?;

        let mut compile_log = String::new();
        
        // 2. Biên dịch
        let (submission_bin, checker_bin) = if use_isolate {
            if is_debug { println!("[LOG] Đang biên dịch submission bằng Isolate (Box 99)..."); }
            let sub_bin_raw = IsolateManager::compile_in_box(99, &code_path, true).await?;
            let sub_bin = bin_dir.join("submission.bin");
            tokio::fs::copy(&sub_bin_raw, &sub_bin).await?;
            let _ = IsolateManager::cleanup(99).await;

            let chk_bin = if let Some(cp) = checker_path {
                if is_debug { println!("[LOG] Đang biên dịch checker bằng Isolate (Box 98)..."); }
                let chk_raw = IsolateManager::compile_in_box(98, &cp, true).await?;
                let chk_path = bin_dir.join("checker.bin");
                tokio::fs::copy(&chk_raw, &chk_path).await?;
                let _ = IsolateManager::cleanup(98).await;
                Some(chk_path)
            } else { None };

            (sub_bin, chk_bin)
        } else {
            let sub_bin = bin_dir.join(exec_name("submission"));
            match cfg.language {
                Language::C => compile_c(&code_path, &sub_bin, &mut compile_log).await?,
                Language::Cpp => compile_cpp(&code_path, &sub_bin, &mut compile_log).await?,
            }
            let chk_bin = if let Some(cp) = checker_path {
                let p = bin_dir.join(exec_name("checker"));
                compile_cpp(&cp, &p, &mut compile_log).await?;
                Some(p)
            } else { None };
            (sub_bin, chk_bin)
        };

        // 3. Thu thập Testcases
        let test_cases = collect_testcases(temp.path())?;
        if is_debug { println!("\x1b[36m[LOG] Tìm thấy {} testcases. Bắt đầu chấm...\x1b[0m", test_cases.len()); }
        
        let mut results = Vec::new();

        // 4. Chạy từng Testcase
        for (idx, (inp, ans)) in test_cases.iter().enumerate() {
            let res = if use_isolate {
                IsolateManager::run_single_test_isolate(
                    idx as u32,
                    &submission_bin,
                    checker_bin.as_deref(),
                    inp,
                    ans.as_deref(),
                    cfg.time_limit_ms,
                    cfg.memory_limit_kb,
                    cfg.input_mode.clone(),
                ).await
            } else {
                run_single_test(
                    &submission_bin, 
                    checker_bin.as_ref().map(|p| p.as_path()), 
                    inp, 
                    ans.as_ref().map(|p| p.as_path()), 
                    cfg.time_limit_ms, 
                    cfg.memory_limit_kb, 
                    cfg.input_mode.clone()
                ).await
            };

            if is_debug {
                let status_color = if res.passed { "32" } else { "31" };
                println!("\x1b[{}m  -> Case {}: Passed: {} | Time: {}ms | Mem: {:?}kb\x1b[0m", 
                    status_color, res.case_name, res.passed, res.time_ms, res.memory_kb.unwrap_or(0));
            }
            results.push(res);
        }

        if is_debug {
            let total_passed = results.iter().filter(|r| r.passed).count();
            println!("\x1b[1;32m✅ Job hoàn thành: {}/{} passed\x1b[0m", total_passed, results.len());
        }

        Ok(ExecResult { compile_ok: true, compile_log, tests: results })
    }
}