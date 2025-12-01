mod monitor;
mod stats;
mod  pool;
use monitor::Monitor;
use dotenvy::dotenv;
use axum::{
    extract::Query,
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse},
    routing::get,
    Router,
    extract::Extension
};
use serde::Deserialize;
use std::{path::{Path}};
use zip::{ZipArchive, ZipWriter, write::FileOptions};
use std::io::{Write, Read, Cursor};
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

#[tokio::main]
async fn main() {
    dotenv().ok();
    let (tx, rx) = mpsc::channel::<StatEvent>(1000);
    spawn_stats_pool(rx, 500);
    let app = Router::new()
                .route("/download", get(download_zip))
    .layer(Extension(tx.clone()));


    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Server chạy tại http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}
