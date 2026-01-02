pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

#[derive(Debug, Clone, Copy)]
pub enum InputMode {
    Stdin,
    File,
}

#[derive(Debug, Clone)]
pub enum Language {
    C,
    Cpp,
}

#[derive(Debug, Clone)]
pub struct JobConfig {
    pub id: String,
    pub name: String,
    pub s3_base_url: String,
    pub time_limit_ms: u64,
    pub memory_limit_kb: u64,
    pub input_mode: InputMode,
    pub language: Language,
}

#[derive(Debug, Clone)]
pub struct TestCaseResult {
    pub case_name: String,
    pub passed: bool,
    pub time_ms: u128,
    pub memory_kb: Option<u64>,
    pub checker_exit_ok: bool,
    pub stderr: Option<i8>,
}

#[derive(Debug, Clone)]
pub struct ExecResult {
    pub compile_ok: bool,
    pub compile_log: String,
    pub tests: Vec<TestCaseResult>,
}

pub fn exec_name(base: &str) -> String {
    if cfg!(target_os = "windows") {
        format!("{base}.exe")
    } else {
        base.to_string()
    }
}

