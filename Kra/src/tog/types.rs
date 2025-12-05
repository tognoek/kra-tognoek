//! Các kiểu dữ liệu dùng chung trong module `tog`.
pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

#[derive(Debug, Clone)]
pub struct JobConfig {
    pub id: String,          // id bài (trùng tên file code)
    pub name: String,        // tên bộ test
    pub s3_base_url: String, // ví dụ: http://127.0.0.1:3000
    pub time_limit_ms: u64,  // giới hạn thời gian mỗi test
    pub memory_limit_kb: u64, // giới hạn RAM (chưa enforce, chỉ báo cáo)
}

#[derive(Debug, Clone)]
pub struct TestCaseResult {
    pub case_name: String,
    pub passed: bool,
    pub time_ms: u128,
    pub memory_kb: Option<u64>,
    pub checker_exit_ok: bool,
    pub stderr: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ExecResult {
    pub compile_ok: bool,
    pub compile_log: String,
    pub tests: Vec<TestCaseResult>,
}

/// Đặt tên file nhị phân (thêm .exe trên Windows).
pub fn exec_name(base: &str) -> String {
    if cfg!(target_os = "windows") {
        format!("{base}.exe")
    } else {
        base.to_string()
    }
}

