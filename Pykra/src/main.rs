use google_generative_ai_rs::v1::api::Client;
use google_generative_ai_rs::v1::gemini::request::GeminiRequest;
use google_generative_ai_rs::v1::gemini::{Content, Part, Model};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Khởi tạo Client với API Key
    let client = Client::new("AIzaSyDzRNQwod4KOSwuuiFU0UmPIJYsGSWXZic".to_string());

    // 2. Tạo nội dung câu hỏi theo đúng cấu trúc của ver 0.3.4
    let txt_request = GeminiRequest {
        contents: vec![Content {
            role: Some("user".to_string()),
            parts: vec![Part {
                text: Some("Chào Gemini, tôi đang dùng Rust trên Kali Linux!".to_string()),
                ..Default::default()
            }],
        }],
        ..Default::default()
    };

    // 3. Gọi mô hình 1.5-flash
    let response = client.post_model_generate_content(Model::Gemini15Flash, txt_request).await?;

    // 4. In kết quả
    if let Some(candidate) = response.candidates.get(0) {
        if let Some(part) = candidate.content.parts.get(0) {
            if let Some(text) = &part.text {
                println!("Gemini: {}", text);
            }
        }
    }

    Ok(())
}