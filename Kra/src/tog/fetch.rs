//! Phần tải và giải nén bundle từ S3 + thu thập file.

use std::fs::File;
use std::io;
use std::path::{Path, PathBuf};

use reqwest::Url;
use tokio::fs;
use walkdir::WalkDir;
use zip::ZipArchive;

use crate::tog::types::{BoxError, JobConfig};

/// Tải zip từ S3 dựa trên id/name.
pub async fn download_bundle(cfg: &JobConfig, dest: &Path) -> Result<(), BoxError> {
    let url = Url::parse_with_params(
        &format!("{}/download", cfg.s3_base_url.trim_end_matches('/')),
        &[("id", cfg.id.as_str()), ("name", cfg.name.as_str())],
    )?;
    let resp = reqwest::get(url).await?;
    if !resp.status().is_success() {
        return Err(format!("Download failed: HTTP {}", resp.status()).into());
    }
    let bytes = resp.bytes().await?;
    fs::write(dest, &bytes).await?;
    Ok(())
}

/// Giải nén file zip vào thư mục đích.
pub fn unzip_bundle(zip_path: &Path, target_dir: &Path) -> Result<(), BoxError> {
    let file = File::open(zip_path)?;
    let mut archive = ZipArchive::new(file)?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let out_path = target_dir.join(entry.mangled_name());

        if entry.is_dir() {
            std::fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let mut outfile = File::create(&out_path)?;
            io::copy(&mut entry, &mut outfile)?;
        }
    }
    Ok(())
}

/// Tìm file code thí sinh trong thư mục đã giải nén.
pub fn find_code_file(root: &Path, id: &str) -> Result<PathBuf, BoxError> {
    let exact = root.join("code").join(format!("{}.cpp", id));
    if exact.exists() {
        return Ok(exact);
    }
    // fallback: lấy file .cpp đầu tiên
    for entry in WalkDir::new(root) {
        let entry = entry?;
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                if ext == "cpp" {
                    return Ok(entry.into_path());
                }
            }
        }
    }
    Err("Không tìm thấy file code .cpp".into())
}

/// Tìm checker (check.cpp) nếu có.
pub fn find_checker(root: &Path) -> Option<PathBuf> {
    for entry in WalkDir::new(root) {
        if let Ok(e) = entry {
            if e.file_type().is_file() && e.file_name().to_string_lossy() == "check.cpp" {
                return Some(e.into_path());
            }
        }
    }
    None
}

/// Thu thập các test case: (input, answer).
pub fn collect_testcases(root: &Path) -> Result<Vec<(PathBuf, Option<PathBuf>)>, BoxError> {
    let mut cases = Vec::new();
    for entry in WalkDir::new(root) {
        let entry = entry?;
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                if ext == "inp" {
                    let inp = entry.into_path();
                    let ans = inp.with_extension("out");
                    let ans_opt = if ans.exists() { Some(ans) } else { None };
                    cases.push((inp, ans_opt));
                }
            }
        }
    }
    cases.sort();
    Ok(cases)
}

