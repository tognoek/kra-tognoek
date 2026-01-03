mod tog;

use axum::{
    extract::Form,
    response::Html,
    routing::{get, post},
    Router,
};
use std::env;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use redis::AsyncCommands;
use serde::Deserialize;
use serde_json::{json, Value};
use tokio::net::TcpListener;
use tokio::select;

// Import các thành phần từ module tog
use tog::{Executor, BoxError, JobConfig, ExecResult, InputMode, Language};

#[derive(Debug, Deserialize)]
struct JobEnvelope {
    id: String,
    task: String,
    data: Value,
    #[allow(dead_code)]
    timestamp: u64,
}

#[derive(Debug, Deserialize)]
struct JudgeData {
    #[serde(rename = "submissionId")]
    submission_id: Option<String>,
    #[allow(dead_code)]
    #[serde(rename = "problemId")]
    problem_id: Option<String>,
    #[serde(rename = "codeId")]
    code_id: String,
    #[serde(rename = "testId")]
    test_id: String,
    #[serde(rename = "timeLimitMs")]
    time_limit_ms: u64,
    #[serde(rename = "memoryLimitKb")]
    memory_limit_kb: u64,
    #[serde(rename = "inputMode")]
    input_mode: String,
    #[serde(rename = "language")]
    language: Option<String>,
    #[serde(rename = "serverBaseUrl")]
    server_base_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct JudgeForm {
    code_id: String,
    test_id: String,
    time_limit_ms: u64,
    memory_limit_kb: u64,
    input_mode: String,
    language: Option<String>,
}

// --- Giao diện Web UI ---
async fn index_page() -> Html<String> {
    match tokio::fs::read_to_string("ui/index.html").await {
        Ok(content) => Html(content),
        Err(e) => Html(format!("<h1>Lỗi đọc ui/index.html</h1><pre>{}</pre>", e)),
    }
}

async fn enqueue_job(Form(form): Form<JudgeForm>) -> Html<String> {
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let queue_name = env::var("REDIS_QUEUE").unwrap_or_else(|_| "job_queue".to_string());

    let client = redis::Client::open(redis_url).expect("Invalid Redis URL");
    let mut conn = client.get_async_connection().await.expect("Redis connection failed");

    let now_ms = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    let job_id = format!("manual-{}", now_ms);

    let job = json!({
        "id": job_id,
        "task": "judge",
        "data": {
            "codeId": form.code_id,
            "testId": form.test_id,
            "timeLimitMs": form.time_limit_ms,
            "memoryLimitKb": form.memory_limit_kb,
            "inputMode": form.input_mode,
            "language": form.language.unwrap_or_else(|| "cpp".to_string()),
        },
        "timestamp": now_ms,
    });

    let _: redis::RedisResult<()> = conn.rpush(&queue_name, job.to_string()).await;

    Html(format!(
        r#"<html><body style="font-family:sans-serif;padding:20px;"><h2>✅ Job queued: {}</h2><a href="/">Back</a></body></html>"#,
        job_id
    ))
}

// --- Logic xử lý chính ---
#[tokio::main]
async fn main() -> Result<(), BoxError> {
    dotenvy::dotenv().ok();

    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let queue_name = env::var("REDIS_QUEUE").unwrap_or_else(|_| "job_queue".to_string());
    let s3_base_url = env::var("S3_BASE_URL").unwrap_or_else(|_| "http://127.0.0.1:3001".to_string());
    let use_ui = env::var("UI").unwrap_or_default() == "true";
    let is_debug = env::var("DEBUG").unwrap_or_default() == "true";
    let web_port: u16 = env::var("KRA_WEB_PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(4000);

    println!("\x1b[1;32m🚀 Kra worker starting...\x1b[0m");
    println!("   Redis: {}", redis_url);
    println!("   Queue: {}", queue_name);
    println!("   Debug: {}", is_debug);
    println!("   UI   : {}", use_ui);

    let redis_client = redis::Client::open(redis_url)?;
    let mut worker_conn = redis_client.get_async_connection().await?;

    // Nhánh 1: Web Server (Chỉ chạy nếu UI=true)
    let web_task = async {
        if use_ui {
            let app = Router::new()
                .route("/", get(index_page))
                .route("/enqueue", post(enqueue_job));
            
            let addr = format!("127.0.0.1:{}", web_port);
            let listener = TcpListener::bind(&addr).await.unwrap();
            println!("\x1b[36m🌐 Web UI is live at http://{}\x1b[0m", addr);
            axum::serve(listener, app).await.unwrap();
        } else {
            // Treo task này nếu không dùng UI
            std::future::pending::<()>().await;
        }
    };

    // Nhánh 2: Worker Loop
    let worker_task = async {
        loop {
            let res: Option<(String, String)> = match redis::cmd("BLPOP")
                .arg(&queue_name)
                .arg(0)
                .query_async(&mut worker_conn)
                .await 
            {
                Ok(v) => v,
                Err(e) => {
                    eprintln!("❌ Redis Error: {}", e);
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    continue;
                }
            };

            if let Some((_, job_json)) = res {
                if is_debug { println!("\x1b[1;34m📥 New Job Received\x1b[0m"); }
                if let Err(e) = handle_job(&job_json, &s3_base_url, is_debug).await {
                    eprintln!("❌ Job Handling Error: {}", e);
                }
            }
        }
    };

    // Chạy song song cả 2 tác vụ
    select! {
        _ = web_task => {},
        _ = worker_task => {},
    }

    Ok(())
}

async fn handle_job(job_json: &str, s3_base_url: &str, is_debug: bool) -> Result<(), BoxError> {
    let env: JobEnvelope = serde_json::from_str(job_json)?;
    if env.task != "judge" { return Ok(()); }

    let data: JudgeData = serde_json::from_value(env.data)?;

    let input_mode = if data.input_mode.to_lowercase() == "file" { InputMode::File } else { InputMode::Stdin };
    let language = if data.language.as_ref().map(|s| s.to_lowercase()).as_deref() == Some("c") { Language::C } else { Language::Cpp };

    let cfg = JobConfig {
        id: data.code_id.clone(),
        name: data.test_id.clone(),
        s3_base_url: s3_base_url.to_string(),
        time_limit_ms: data.time_limit_ms,
        memory_limit_kb: data.memory_limit_kb,
        input_mode,
        language,
    };

    // Gọi Executor chấm bài
    let exec_res = Executor::run_job(cfg).await;

    // Phân tích kết quả
    let codes = build_result_codes(&exec_res);
    let (total_time, total_mem) = summarize_result(&exec_res);

    println!("\x1b[1;32m🏁 DONE: Result Codes {:?} | Max Time: {}ms | Max Mem: {}kb\x1b[0m", 
             codes, total_time, total_mem);

    // Gửi Callback về Server chính (nếu có)
    if let (Some(sub_id), Some(srv_url)) = (data.submission_id, data.server_base_url) {
        if is_debug { println!("[LOG] Sending callback to {}...", srv_url); }
        send_callback(&srv_url, &sub_id, total_time, total_mem, &codes).await;
    }

    Ok(())
}

async fn send_callback(url: &str, id: &str, time: i32, mem: i32, codes: &[i8]) {
    let client = reqwest::Client::new();
    let cb_url = format!("{}/api/submissions/{}/callback", url, id);
    let secret = env::var("WORKER_SECRET").unwrap_or_default();

    let body = json!({
        "TrangThaiCham": codes,
        "ThoiGianThucThi": time,
        "BoNhoSuDung": mem,
    });

    let _ = client.post(&cb_url).header("x-worker-key", secret).json(&body).send().await;
}

fn summarize_result(res: &Result<ExecResult, BoxError>) -> (i32, i32) {
    match res {
        Ok(exec) if exec.compile_ok => {
            let max_time = exec.tests.iter().map(|t| t.time_ms).max().unwrap_or(0) as i32;
            let max_mem = exec.tests.iter().filter_map(|t| t.memory_kb).max().unwrap_or(0) as i32;
            (max_time, max_mem)
        },
        _ => (0, 0)
    }
}

fn build_result_codes(res: &Result<ExecResult, BoxError>) -> Vec<i8> {
    match res {
        Ok(exec) => {
            if !exec.compile_ok { vec![-1] }
            else { exec.tests.iter().map(|t| t.stderr.unwrap_or(-1)).collect() }
        },
        Err(_) => vec![-1],
    }
}