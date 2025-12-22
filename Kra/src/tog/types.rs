//! Các kiểu dữ liệu dùng chung trong module `tog`.
pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

/// Cách bài toán đọc input.
#[derive(Debug, Clone)]
pub enum InputMode {
    /// Đọc từ stdin (nhập từ bàn phím) – Kra sẽ pipe dữ liệu test vào stdin.
    Stdin,
    /// Đọc từ file – chương trình tự mở file `.in` (Kra không pipe stdin).
    File,
}

#[derive(Debug, Clone)]
pub enum Language {
    /// Ngôn ngữ C (biên dịch bằng gcc)
    C,
    /// Ngôn ngữ C++ (biên dịch bằng g++)
    Cpp,
}

#[derive(Debug, Clone)]
pub struct JobConfig {
    /// id code – trùng tên file code trong S3 (data/code/{id}.cpp)
    pub id: String,
    /// id test – trùng tên file zip test trong S3 (data/test/{name}.zip)
    pub name: String,
    /// URL S3 service, ví dụ: http://127.0.0.1:3001
    pub s3_base_url: String,
    /// Giới hạn thời gian mỗi test (ms)
    pub time_limit_ms: u64,
    /// Giới hạn RAM ước lượng (KB)
    pub memory_limit_kb: u64,
    /// Kiểu đọc input cho bài này.
    pub input_mode: InputMode,
    /// Ngôn ngữ dùng để biên dịch (C hoặc C++)
    pub language: Language,
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

