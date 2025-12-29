use sqlx::mysql::MySqlPoolOptions;
use sqlx::Row;
use std::env;
use std::time::Duration;
use tokio::time::sleep;
use chrono::{Utc, Duration as ChronoDuration};
use serde::{Deserialize, Serialize};

// Cấu trúc dữ liệu gửi lên OpenAI
#[derive(Serialize)]
struct ModerationRequest {
    input: String,
}

// Cấu trúc dữ liệu nhận về từ OpenAI
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
    // Nạp biến môi trường từ .env
    dotenvy::dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let openai_key = env::var("OPENAI_API_KEY").expect("OPENAI_API_KEY must be set");

    // Khởi tạo kết nối Database Pool
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let client = reqwest::Client::new();

    println!("🤖 Service kiểm duyệt AI của Kra Tognoek đã sẵn sàng...");
    println!("⏰ Tần suất quét: Mỗi 24 giờ một lần.");

    loop {
        println!("🚀 [{}] Bắt đầu chu kỳ quét mới...", Utc::now().format("%Y-%m-%d %H:%M:%S"));

        // 1. Lấy mốc thời gian (ví dụ: các comment trong 24h qua)
        let one_day_ago = Utc::now() - ChronoDuration::days(1);
        
        // 2. Truy vấn các bình luận đang hiển thị (TrangThai = 1)
        let rows = sqlx::query("SELECT IdBinhLuan, NoiDung FROM BinhLuan WHERE TrangThai = 1 AND NgayTao > ?")
            .bind(one_day_ago)
            .fetch_all(&pool)
            .await;

        match rows {
            Ok(comments) => {
                if comments.is_empty() {
                    println!("✅ Không có bình luận mới.");
                } else {
                    println!("🔍 Đang kiểm tra {} bình luận...", comments.len());
                    
                    for row in comments {
                        let id: i64 = row.get("IdBinhLuan");
                        let content: String = row.get("NoiDung");

                        // 3. Gọi OpenAI Moderation API (Bản miễn phí)
                        let api_res = client.post("https://api.openai.com/v1/moderations")
                            .header("Authorization", format!("Bearer {}", openai_key))
                            .json(&ModerationRequest { input: content.clone() })
                            .send()
                            .await;

                        if let Ok(res) = api_res {
                            if let Ok(json) = res.json::<ModerationResponse>().await {
                                if json.results[0].flagged {
                                    println!("🚫 VI PHẠM: ID {} - Nội dung: {}", id, content);
                                    
                                    // 4. Ẩn bình luận vi phạm
                                    let _ = sqlx::query("UPDATE BinhLuan SET TrangThai = 0 WHERE IdBinhLuan = ?")
                                        .bind(id)
                                        .execute(&pool)
                                        .await;
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => eprintln!("❌ Lỗi truy vấn Database: {:?}", e),
        }

        println!("😴 Chu kỳ hoàn tất. Hệ thống nghỉ ngơi...");
        
        // CHO NÓ NGỦ: 24 giờ (đơn vị giây)
        sleep(Duration::from_secs(24 * 60 * 60)).await;
    }
}