mod monitor;
mod stats;
mod  pool;
use monitor::Monitor;
use dotenvy::dotenv;
use axum::{
    extract::{Query, Multipart},
    http::{header, HeaderMap, StatusCode},
    response::{Html, IntoResponse},
    routing::{get, post},
    Router,
    extract::Extension
};
use serde::Deserialize;
use std::path::Path;
use zip::{ZipArchive, ZipWriter, write::FileOptions};
use std::io::{Write, Read, Cursor};
use tokio::fs;
use tokio::sync::mpsc;
use tokio::task;
use crate::stats::StatEvent;
use crate::pool::spawn_stats_pool;

const DATA_DIR: &str = "data";

#[derive(Deserialize)]
struct Params {
    id: String,
    name: String,
}

#[derive(Deserialize)]
struct DownloadParams {
    id: String,
}

async fn download_zip(Query(params): Query<Params>, 
        Extension(tx): Extension<mpsc::Sender<StatEvent>>) -> impl IntoResponse {
    let monitor = Monitor::start();

    if !is_safe_name(&params.id) || !is_safe_name(&params.name) {
        let res = monitor.end();
        let _ = tx.send(res).await;
        return (StatusCode::BAD_REQUEST, "Invalid id or name".to_string()).into_response();
    }

    let code_path = Path::new(DATA_DIR).join("code").join(format!("{}.cpp", params.id));
    let test_path = Path::new(DATA_DIR).join("test").join(format!("{}.zip", &params.name));

    let code_path_clone = code_path.clone();
    let test_path_clone = test_path.clone();

    let resp = match task::spawn_blocking(move || {
        merge_zip_and_code_sync(&test_path_clone, &code_path_clone)
    }).await {
        Ok(Ok(bytes)) => {
            let filename = format!("{}_{}.zip", params.id, params.name);
            let mut headers = HeaderMap::new();
            headers.insert(header::CONTENT_TYPE, "application/zip".parse().unwrap());
            headers.insert(
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{}\"", filename)
                    .parse()
                    .unwrap(),
            );
            (headers, bytes).into_response()
        }
        Ok(Err(e)) => {
            eprintln!("Zip error: {}", e); 
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Zip error: {}", e),
            ).into_response()
        }
        Err(e) => {
            eprintln!("Task join error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Task error: {}", e),
            ).into_response()
        }
    };

    let res = monitor.end();
    let _ = tx.send(res).await;

    resp
}

fn merge_zip_and_code_sync(test_zip_path: &Path, code_path: &Path) -> std::io::Result<Vec<u8>> {
    let test_zip_bytes = std::fs::read(test_zip_path)?;
    let reader = Cursor::new(test_zip_bytes);
    let mut archive = ZipArchive::new(reader)?;

    let buffer = Vec::new();
    let cursor = Cursor::new(buffer);
    let mut zip_out = ZipWriter::new(cursor);

    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755); 

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let name = file.name().to_string();
        
        let mut contents = Vec::new();
        file.read_to_end(&mut contents)?;
        
        zip_out.start_file(name, options)?;
        zip_out.write_all(&contents)?;
    }

    if code_path.exists() {
        let code_content = std::fs::read(code_path)?;
        let filename = code_path
            .file_name()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid filename"))?
            .to_string_lossy();
            
        zip_out.start_file(format!("code/{}", filename), options)?;
        zip_out.write_all(&code_content)?;
    }

    let cursor = zip_out.finish()?;
    let final_bytes = cursor.into_inner();

    Ok(final_bytes)
}

fn is_safe_name(s: &str) -> bool {
    s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

// Download file code .cpp theo id
async fn download_code_file(
    Query(params): Query<DownloadParams>,
    Extension(tx): Extension<mpsc::Sender<StatEvent>>,
) -> impl IntoResponse {
    let monitor = Monitor::start();

    if !is_safe_name(&params.id) {
        let res = monitor.end();
        let _ = tx.send(res).await;
        return (StatusCode::BAD_REQUEST, "Invalid id".to_string()).into_response();
    }

    let code_path = Path::new(DATA_DIR).join("code").join(format!("{}.cpp", params.id));

    match fs::read(&code_path).await {
        Ok(content) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            let mut headers = HeaderMap::new();
            headers.insert(header::CONTENT_TYPE, "text/plain; charset=utf-8".parse().unwrap());
            headers.insert(
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{}.cpp\"", params.id)
                    .parse()
                    .unwrap(),
            );
            (headers, content).into_response()
        }
        Err(_) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            (
                StatusCode::NOT_FOUND,
                format!("File code {} không tồn tại", params.id),
            )
                .into_response()
        }
    }
}

// Download file test .zip theo id
async fn download_test_file(
    Query(params): Query<DownloadParams>,
    Extension(tx): Extension<mpsc::Sender<StatEvent>>,
) -> impl IntoResponse {
    let monitor = Monitor::start();

    if !is_safe_name(&params.id) {
        let res = monitor.end();
        let _ = tx.send(res).await;
        return (StatusCode::BAD_REQUEST, "Invalid id".to_string()).into_response();
    }

    let test_path = Path::new(DATA_DIR).join("test").join(format!("{}.zip", params.id));

    match fs::read(&test_path).await {
        Ok(content) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            let mut headers = HeaderMap::new();
            headers.insert(header::CONTENT_TYPE, "application/zip".parse().unwrap());
            headers.insert(
                header::CONTENT_DISPOSITION,
                format!("attachment; filename=\"{}.zip\"", params.id)
                    .parse()
                    .unwrap(),
            );
            (headers, content).into_response()
        }
        Err(_) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            (
                StatusCode::NOT_FOUND,
                format!("File test {} không tồn tại", params.id),
            )
                .into_response()
        }
    }
}

// API 1: Upload file .cpp vào thư mục code
async fn upload_code(
    Extension(tx): Extension<mpsc::Sender<StatEvent>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let monitor = Monitor::start();
    let mut filename: Option<String> = None;
    let mut file_data: Option<Vec<u8>> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();
        
        if field_name == "name" || field_name == "filename" {
            match field.text().await {
                Ok(name) => {
                    if is_safe_name(&name) {
                        filename = Some(name);
                    } else {
                        let res = monitor.end();
                        let _ = tx.send(res).await;
                        return (StatusCode::BAD_REQUEST, "Invalid filename".to_string()).into_response();
                    }
                }
                Err(_) => continue,
            }
        } else if field_name == "file" {
            match field.bytes().await {
                Ok(data) => {
                    file_data = Some(data.to_vec());
                }
                Err(_) => continue,
            }
        }
    }

    // Validate
    let filename = match filename {
        Some(f) => f,
        None => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            return (StatusCode::BAD_REQUEST, "Missing filename parameter".to_string()).into_response();
        }
    };

    let file_data = match file_data {
        Some(d) => d,
        None => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            return (StatusCode::BAD_REQUEST, "Missing file".to_string()).into_response();
        }
    };

    // Tạo thư mục nếu chưa tồn tại
    let code_dir = Path::new(DATA_DIR).join("code");
    if let Err(e) = fs::create_dir_all(&code_dir).await {
        let res = monitor.end();
        let _ = tx.send(res).await;
        eprintln!("Failed to create code directory: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create directory: {}", e)).into_response();
    }

    // Lưu file
    let file_path = code_dir.join(format!("{}.cpp", filename));
    match fs::write(&file_path, file_data).await {
        Ok(_) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            (StatusCode::OK, format!("File saved: {}", file_path.display())).into_response()
        }
        Err(e) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            eprintln!("Failed to save file: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)).into_response()
        }
    }
}

// API 2: Upload file .zip vào thư mục test
async fn upload_test(
    Extension(tx): Extension<mpsc::Sender<StatEvent>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let monitor = Monitor::start();
    let mut filename: Option<String> = None;
    let mut file_data: Option<Vec<u8>> = None;

    // Parse multipart form data
    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();
        
        if field_name == "name" || field_name == "filename" {
            match field.text().await {
                Ok(name) => {
                    if is_safe_name(&name) {
                        filename = Some(name);
                    } else {
                        let res = monitor.end();
                        let _ = tx.send(res).await;
                        return (StatusCode::BAD_REQUEST, "Invalid filename".to_string()).into_response();
                    }
                }
                Err(_) => continue,
            }
        } else if field_name == "file" {
            match field.bytes().await {
                Ok(data) => {
                    file_data = Some(data.to_vec());
                }
                Err(_) => continue,
            }
        }
    }

    // Validate
    let filename = match filename {
        Some(f) => f,
        None => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            return (StatusCode::BAD_REQUEST, "Missing filename parameter".to_string()).into_response();
        }
    };

    let file_data = match file_data {
        Some(d) => d,
        None => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            return (StatusCode::BAD_REQUEST, "Missing file".to_string()).into_response();
        }
    };

    // Validate file là zip
    if !is_valid_zip(&file_data) {
        let res = monitor.end();
        let _ = tx.send(res).await;
        return (StatusCode::BAD_REQUEST, "Invalid zip file".to_string()).into_response();
    }

    // Tạo thư mục nếu chưa tồn tại
    let test_dir = Path::new(DATA_DIR).join("test");
    if let Err(e) = fs::create_dir_all(&test_dir).await {
        let res = monitor.end();
        let _ = tx.send(res).await;
        eprintln!("Failed to create test directory: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create directory: {}", e)).into_response();
    }

    // Lưu file
    let file_path = test_dir.join(format!("{}.zip", filename));
    match fs::write(&file_path, file_data).await {
        Ok(_) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            (StatusCode::OK, format!("File saved: {}", file_path.display())).into_response()
        }
        Err(e) => {
            let res = monitor.end();
            let _ = tx.send(res).await;
            eprintln!("Failed to save file: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)).into_response()
        }
    }
}

// Kiểm tra file có phải là zip hợp lệ không
fn is_valid_zip(data: &[u8]) -> bool {
    if data.len() < 4 {
        return false;
    }
    // ZIP file signature: PK\x03\x04 hoặc PK\x05\x06 (empty zip) hoặc PK\x07\x08
    data[0] == 0x50 && data[1] == 0x4B && (data[2] == 0x03 || data[2] == 0x05 || data[2] == 0x07)
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let (tx, rx) = mpsc::channel::<StatEvent>(1000);
    // Tăng interval từ 500ms lên 2000ms (2 giây) để giảm tải CPU/RAM
    spawn_stats_pool(rx, 2000);
    // Handler để serve trang HTML upload
    async fn upload_page() -> Html<&'static str> {
        Html(include_str!("../upload.html"))
    }

    let app = Router::new()
        .route("/", get(upload_page))
        .route("/upload.html", get(upload_page))
        .route("/download", get(download_zip))
        .route("/download/code", get(download_code_file))
        .route("/download/test", get(download_test_file))
        .route("/upload/code", post(upload_code))
        .route("/upload/test", post(upload_test))
        .layer(Extension(tx.clone()));


    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("S3 chạy tại http://127.0.0.1:3001");
    axum::serve(listener, app).await.unwrap();
}
