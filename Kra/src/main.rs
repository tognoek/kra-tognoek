mod tog;

use axum::{
    extract::Form,
    response::Html,
    routing::{get, post},
    Router,
};
use std::env;
use redis::AsyncCommands;
use serde::Deserialize;
use serde_json::{json, Value};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::net::TcpListener;
use tokio::select;
use tog::{Executor, BoxError, JobConfig, ExecResult, InputMode, Language};

#[derive(Debug, Deserialize)]
struct JobEnvelope {
    id: String,
    task: String,
    data: Value,
    timestamp: u64,
}

#[derive(Debug, Deserialize)]
struct JudgeData {
    #[serde(rename = "submissionId")]
    submission_id: Option<String>,
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

async fn index_page() -> Html<String> {
    match tokio::fs::read_to_string("ui/index.html").await {
        Ok(content) => Html(content),
        Err(e) => Html(format!(
            "<h1>Lỗi đọc ui/index.html</h1><pre>{}</pre>",
            e
        )),
    }
}

async fn enqueue_job(Form(form): Form<JudgeForm>) -> Html<String> {
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let queue_name =
        std::env::var("REDIS_QUEUE").unwrap_or_else(|_| "job_queue".to_string());

    let client = match redis::Client::open(redis_url) {
        Ok(c) => c,
        Err(e) => {
            return Html(format!("Redis client error: {}", e));
        }
    };

    let mut conn = match client.get_async_connection().await {
        Ok(c) => c,
        Err(e) => {
            return Html(format!("Redis connection error: {}", e));
        }
    };

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
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

    let job_str = job.to_string();

    let push_res: redis::RedisResult<()> =
        conn.rpush(&queue_name, job_str.clone()).await;

    match push_res {
        Ok(_) => Html(format!(
            r#"<html><body style="font-family: system-ui; padding: 20px;">
            <h2>✅ Đã đẩy job vào Redis thành công!</h2>
            <p>Job ID: <code>{}</code></p>
            <p><a href="/">← Quay lại form</a></p>
            </body></html>"#,
            job_id
        )),
        Err(e) => Html(format!(
            r#"<html><body style="font-family: system-ui; padding: 20px;">
            <h2 style="color: red;">❌ Lỗi khi đẩy job vào Redis</h2>
            <pre>{}</pre>
            <p><a href="/">← Quay lại form</a></p>
            </body></html>"#,
            e
        )),
    }
}

#[tokio::main]
async fn main() -> Result<(), BoxError> {

    dotenvy::dotenv().ok();

    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let queue_name =
        std::env::var("REDIS_QUEUE").unwrap_or_else(|_| "job_queue".to_string());
    let s3_base_url =
        std::env::var("S3_BASE_URL").unwrap_or_else(|_| "http://127.0.0.1:3001".to_string());
    let web_port: u16 = std::env::var("KRA_WEB_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(4000);

    println!("🚀 Kra worker + Web UI starting...");
    println!("Redis URL: {}", redis_url);
    println!("Queue    : {}", queue_name);
    println!("S3 base  : {}", s3_base_url);
    println!("Web UI   : http://127.0.0.1:{}", web_port);

    let redis_client = match redis::Client::open(redis_url.clone()) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("❌ Không tạo được Redis client với URL {}: {}", redis_url, e);
            eprintln!("💡 Kiểm tra lại REDIS_URL hoặc cài đặt Redis.");
            return Err(format!("Redis client init failed: {}", e).into());
        }
    };
    let mut worker_conn = match redis_client.get_async_connection().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("❌ Không kết nối được Redis tại {}: {}", redis_url, e);
            if e.to_string().contains("Connection refused") {
                eprintln!("💡 Có thể Redis chưa được start trên 127.0.0.1:6379 (os error 10061).");
            }
            return Err(format!("Redis connection failed: {}", e).into());
        }
    };

    let web_app = Router::new()
        .route("/", get(index_page))
        .route("/enqueue", post(enqueue_job));

    let web_listener = TcpListener::bind(format!("127.0.0.1:{}", web_port))
        .await
        .map_err(|e| format!("Failed to bind web port {}: {}", web_port, e))?;

    select! {
        _ = async {
            let _ = axum::serve(web_listener, web_app).await;
        } => {
            eprintln!("Web server stopped");
        }
        _ = async {
            loop {
                let res: Option<(String, String)> = match redis::cmd("BLPOP")
                    .arg(&queue_name)
                    .arg(0)
                    .query_async(&mut worker_conn)
                    .await
                {
                    Ok(v) => v,
                    Err(e) => {
                        eprintln!("❌ Redis BLPOP error: {}", e);
                        continue;
                    }
                };

                if let Some((_, job_json)) = res {
                    println!("📥 Nhận job từ Redis: {}", job_json);
                    if let Err(e) = handle_job(&job_json, &s3_base_url).await {
                        eprintln!("❌ Lỗi xử lý job: {}", e);
                    }
                }
            }
        } => {
            eprintln!("Worker stopped");
        }
    }

    Ok(())
}

async fn handle_job(job_json: &str, s3_base_url: &str) -> Result<(), BoxError> {
    let env: JobEnvelope = serde_json::from_str(job_json)?;

    if env.task != "judge" {
        println!("Bỏ qua job với task khác 'judge': {}", env.task);
        return Ok(());
    }

    let data: JudgeData = serde_json::from_value(env.data)?;
    println!(
        "Xử lý job với codeId={} testId={}",
        data.code_id, data.test_id
    );

    let input_mode = match data.input_mode.to_lowercase().as_str() {
        "file" => InputMode::File,
        _ => InputMode::Stdin,
    };

    let language = match data
        .language
        .as_ref()
        .map(|s| s.to_lowercase())
        .as_deref()
    {
        Some("c") => Language::C,
        Some("cpp") => Language::Cpp,
        _ => Language::Cpp,
    };

    let cfg = JobConfig {
        id: data.code_id.clone(),
        name: data.test_id.clone(),
        s3_base_url: s3_base_url.to_string(),
        time_limit_ms: data.time_limit_ms,
        memory_limit_kb: data.memory_limit_kb,
        input_mode,
        language,
    };

    println!("Chạy Executor::run_job với config: {:?}", cfg);
    let exec_res = Executor::run_job(cfg).await;

    let codes = build_result_codes(&exec_res);
    println!("KRA_RESULT_CODES {:?}", codes);

    let (status, total_time_ms, total_mem_kb) = summarize_result(&exec_res);

    if let Some(submission_id) = &data.submission_id {
        if let Some(server_url) = &data.server_base_url {
            send_callback(
                server_url,
                submission_id,
                &exec_res,
                status,
                total_time_ms,
                total_mem_kb,
                &codes,
            )
            .await;
        }
    }

    Ok(())
}

async fn send_callback(
    server_url: &str,
    submission_id: &str,
    exec_res: &Result<ExecResult, BoxError>,
    _status: &str,
    max_time_ms: i32,
    max_mem_kb: i32,
    codes: &[i8],
) {
    let client = reqwest::Client::new();
    let callback_url = format!("{}/api/submissions/{}/callback", server_url, submission_id);

    let worker_secret = env::var("WORKER_SECRET").unwrap_or_else(|_| "".to_string());

    let mut body = serde_json::json!({
        "TrangThaiCham": codes,  // Mảng codes: [-1] hoặc [0,0,1,2,0]
        "ThoiGianThucThi": max_time_ms,
        "BoNhoSuDung": max_mem_kb,
    });

    match exec_res {
        Err(e) => {
            body["compileError"] = serde_json::json!(e.to_string());
        }
        Ok(exec) => {
            if !exec.compile_ok {
                body["compileError"] = serde_json::json!(exec.compile_log);
            }
        }
    }

    match client
    .post(&callback_url)
    .header("x-worker-key", worker_secret)
    .json(&body)
    .send().await {
        Ok(res) => {
            if res.status().is_success() {
                println!("✅ Callback sent successfully to {}", callback_url);
            } else {
                eprintln!("⚠️ Callback returned status: {}", res.status());
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to send callback to {}: {}", callback_url, e);
        }
    }
}

fn summarize_result(res: &Result<ExecResult, BoxError>) -> (&'static str, i32, i32) {
    match res {
        Err(_) => ("error", 0, 0),
        Ok(exec) => {
            if !exec.compile_ok {
                return ("compile_error", 0, 0);
            }

            let mut ok = true;
            let mut max_time = 0i32;
            let mut max_mem = 0i32;

            for t in &exec.tests {
                if !t.passed {
                    ok = false;
                }
                if t.time_ms > max_time as u128 {
                    max_time = t.time_ms as i32;
                }
                if let Some(m) = t.memory_kb {
                    if m as i32 > max_mem {
                        max_mem = m as i32;
                    }
                }
            }

            let status = if ok { "accepted" } else { "wrong_answer" };
            (status, max_time, max_mem)
        }
    }
}

/// -1 = lỗi biên dịch, 0 = đúng, 1 = sai, 2 = quá thời gian, 3 = quá bộ nhớ.
fn build_result_codes(res: &Result<ExecResult, BoxError>) -> Vec<i8> {
    match res {
        Err(_) => vec![-1],
        Ok(exec) => {
            if !exec.compile_ok {
                return vec![-1];
            }

            exec.tests
                .iter()
                .map(|t| {
                    if !t.passed {
                        if let Some(msg) = &t.stderr {
                            if msg.contains("Timeout") {
                                return 2;
                            }
                            if msg.contains("Memory") || msg.contains("memory") || msg.contains("Memory limit") {
                                return 3;
                            }
                        }
                        return 1;
                    }
                    0
                })
                .collect()
        }
    }
}

