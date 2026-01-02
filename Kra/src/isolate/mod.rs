pub mod core;
pub mod utils;

// Re-export để gọi cho ngắn gọn
pub use core::{init_box, cleanup_box, run_in_sandbox};