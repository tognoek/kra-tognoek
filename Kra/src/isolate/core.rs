use std::path::{Path, PathBuf};
use tokio::process::Command;
use crate::tog::types::{BoxError, InputMode};

/// Biên dịch code thí sinh bên trong sandbox Isolate
pub async fn compile_in_sandbox(
    compile_box_id: u32,  // Nên dùng một ID cố định cho biên dịch, ví dụ: 999
    src_path: &Path,      // Đường dẫn file .cpp hoặc .c vừa tải từ S3
    is_cpp: bool,         // True nếu là C++, False nếu là C
) -> Result<PathBuf, BoxError> {
    
    // 1. Khởi tạo Sandbox cho biên dịch
    let init_out = Command::new("isolate")
        .args(["--init", &format!("--box-id={}", compile_box_id)])
        .output().await?;

    if !init_out.status.success() {
        return Err(format!("Isolate Init Fail: {}", String::from_utf8_lossy(&init_out.stderr)).into());
    }

    // Lấy đường dẫn thư mục box (ví dụ: /var/local/lib/isolate/999/box)
    let box_dir = PathBuf::from(String::from_utf8_lossy(&init_out.stdout).trim());
    
    // 2. Copy file nguồn vào trong sandbox
    let file_ext = if is_cpp { "cpp" } else { "c" };
    let internal_src_name = format!("source.{}", file_ext);
    let internal_src_path = box_dir.join(&internal_src_name);
    tokio::fs::copy(src_path, &internal_src_path).await?;

    // 3. Thực thi trình biên dịch bên trong Isolate với giới hạn tài nguyên
    // Giới hạn biên dịch: 10s CPU, 512MB RAM để tránh Compiler Attack
    let out_bin_name = "solution.bin";
    let compiler = if is_cpp { "g++" } else { "gcc" };
    let std_flag = if is_cpp { "-std=c++17" } else { "-std=c11" };

    let mut cmd = Command::new("isolate");
    cmd.args([
        &format!("--box-id={}", compile_box_id),
        "--mem=512000",           // 512MB RAM cho compiler
        "--time=10",              // 10s CPU limit
        "--processes=5",          // Cho phép g++ chạy vài tiến trình con
        "--meta=/tmp/compile.meta",
        "--run", "--", 
        &format!("/usr/bin/{}", compiler),
        std_flag, "-O2", &internal_src_name, "-o", out_bin_name
    ]);

    let compile_output = cmd.output().await?;

    // 4. Kiểm tra kết quả biên dịch
    if !compile_output.status.success() {
        let err_msg = String::from_utf8_lossy(&compile_output.stderr);
        // Sau khi lỗi vẫn nên cleanup
        let _ = Command::new("isolate").args(["--cleanup", &format!("--box-id={}", compile_box_id)]).output().await;
        return Err(format!("Compile Error in Sandbox:\n{}", err_msg).into());
    }

    // 5. Lưu lại file binary đã biên dịch ra ngoài thư mục tạm của hệ thống
    // Hoặc trả về đường dẫn để Executor copy sang sandbox thực thi
    let result_bin_path = box_dir.join(out_bin_name);
    
    // Lưu ý: Đừng cleanup ngay nếu bạn muốn Executor tự vào lấy file .bin
    // Chúng ta sẽ cleanup box biên dịch sau khi đã lấy được file binary.
    Ok(result_bin_path)
}

/// Khởi tạo một box mới và trả về đường dẫn thư mục 'box' bên trong
pub async fn init_box(box_id: u32) -> Result<PathBuf, BoxError> {
    let output = Command::new("isolate")
        .args(["--init", &format!("--box-id={}", box_id)])
        .output().await?;

    if !output.status.success() {
        return Err(format!("Isolate Init Fail: {}", String::from_utf8_lossy(&output.stderr)).into());
    }

    let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(PathBuf::from(path_str))
}

/// Dọn dẹp box sau khi chấm xong
pub async fn cleanup_box(box_id: u32) -> Result<(), BoxError> {
    Command::new("isolate")
        .args(["--cleanup", &format!("--box-id={}", box_id)])
        .output().await?;
    Ok(())
}

/// Hàm thực thi chính bên trong Isolate
pub async fn run_in_sandbox(
    box_id: u32,
    bin_path: &Path,        // Đường dẫn file thực thi đã build bên ngoài
    input_path: &Path,      // Đường dẫn file .inp
    time_limit_ms: u64,
    memory_limit_kb: u64,
    meta_path: &Path,       // Nơi Isolate ghi kết quả đo đạc
) -> Result<Vec<u8>, BoxError> {
    // 1. Init box để lấy đường dẫn thực tế
    let box_dir = init_box(box_id).await?;
    
    // 2. Copy binary vào trong sandbox (đặt tên cố định là 'solution')
    let internal_bin = box_dir.join("solution");
    tokio::fs::copy(bin_path, &internal_bin).await?;

    // 3. Xây dựng lệnh isolate --run
    let mut cmd = Command::new("isolate");
    cmd.args([
        &format!("--box-id={}", box_id),
        &format!("--time={}", time_limit_ms as f64 / 1000.0),
        &format!("--mem={}", memory_limit_kb),
        &format!("--meta={}"), meta_path.to_str().unwrap(),
        "--processes=1", // Bảo mật: chống fork-bomb
        "--run", "--", "./solution"
    ]);

    // Giả sử dùng Stdin Mode (giống code cũ của bạn)
    cmd.arg("--stdin").arg(input_path);

    let output = cmd.output().await?;

    // Lưu ý: Chúng ta không cleanup ở đây vì cần đọc file meta sau đó
    Ok(output.stdout) // Trả về Stdout để so sánh kết quả
}