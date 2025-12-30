use sqlx::mysql::MySqlPoolOptions;
use sqlx::Row;
use std::env;
use std::time::Duration;
use tokio::time::sleep;
use chrono::{Utc, Duration as ChronoDuration};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ModerationRequest {
    input: Vec<String>, // Chuyển từ String thành Vec<String> để gửi một mẻ
}

#[derive(Deserialize)]
struct ModerationResponse {
    results: Vec<ModerationResult>,
}

#[derive(Deserialize)]
struct ModerationResult {
    flagged: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let openai_key = env::var("OPENAI_API_KEY").expect("OPENAI_API_KEY must be set");

    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let client = reqwest::Client::new();

    println!("🤖 Service kiểm duyệt AI (Batch Mode) đã sẵn sàng...");

    loop {
        println!("🚀 [{}] Bắt đầu chu kỳ quét mới...", Utc::now().format("%Y-%m-%d %H:%M:%S"));

        let one_day_ago = Utc::now() - ChronoDuration::days(1);
        
        let rows = sqlx::query("SELECT IdBinhLuan, NoiDung FROM BinhLuan WHERE TrangThai = 1 AND NgayTao > ?")
            .bind(one_day_ago)
            .fetch_all(&pool)
            .await;

        match rows {
            Ok(comments) => {
                if comments.is_empty() {
                    println!("✅ Không có bình luận mới.");
                } else {
                    for chunk in comments.chunks(16) { 
                        let mut ids = Vec::new();
                        let mut contents = Vec::new();

                        for row in chunk {
                            ids.push(row.get::<i64, _>("IdBinhLuan"));
                            contents.push(row.get::<String, _>("NoiDung"));
                        }

                        println!("🔍 Đang kiểm tra mẻ {} bình luận...", contents.len());

                        let api_res = client.post("https://api.openai.com/v1/moderations")
                            .header("Authorization", format!("Bearer {}", openai_key))
                            .json(&ModerationRequest { input: contents.clone() })
                            .send()
                            .await;

                        if let Ok(res) = api_res {
                            if let Ok(json) = res.json::<ModerationResponse>().await {
                                for (idx, result) in json.results.iter().enumerate() {
                                    if result.flagged {
                                        let id = ids[idx];
                                        println!("🚫 VI PHẠM: ID {} - Nội dung: {}", id, contents[idx]);
                                        
                                        let _ = sqlx::query("UPDATE BinhLuan SET TrangThai = 0 WHERE IdBinhLuan = ?")
                                            .bind(id)
                                            .execute(&pool)
                                            .await;
                                    }
                                }
                            }
                        }
                        sleep(Duration::from_millis(1000)).await;
                    }
                }
            }
            Err(e) => eprintln!("❌ Lỗi truy vấn Database: {:?}", e),
        }

        println!("😴 Chu kỳ hoàn tất. Nghỉ 24h...");
        sleep(Duration::from_secs(24 * 60 * 60)).await;
    }
}