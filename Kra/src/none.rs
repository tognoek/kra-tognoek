use std::sync::Arc;
use tokio::sync::Semaphore;
use tokio::time::Duration;
use redis::AsyncCommands; // trait cho các lệnh async
use redis::Client;

// Thay bằng logic thực tế của bạn
async fn solve(job: String) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Start solving job: {}", job);
    // giả lập xử lý
    tokio::time::sleep(Duration::from_secs(5)).await;
    println!("Done job: {}", job);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // cấu hình
    let redis_url = "redis://127.0.0.1/";
    let job_queue = "job_queue";
    let processing_queue = "processing_queue";
    let brpoplpush_timeout_seconds = 1800; // 30 phút
    let max_concurrent_tasks: usize = 4; // N

    // client Redis (chúng ta sẽ clone Arc<Client> để tạo kết nối trong từng task)
    let client = Arc::new(Client::open(redis_url)?);

    // semaphore để giới hạn số task đồng thời
    let semaphore = Arc::new(Semaphore::new(max_concurrent_tasks));

    loop {
        // lấy connection tạm thời để gọi BRPOPLPUSH
        // (chúng ta dùng 1 connection cho lệnh block; kết nối mới sẽ dùng trong task xử lý)
        let mut conn = client.get_async_connection().await?;

        // BRPOPLPUSH: lấy job từ job_queue, push sang processing_queue, block tối đa timeout giây
        // trả về Option<String> (None nếu timeout)
        let job_opt: Option<String> = conn
            .brpoplpush(job_queue, processing_queue, brpoplpush_timeout_seconds)
            .await?;

        // drop conn sớm để tránh giữ connection
        drop(conn);

        match job_opt {
            Some(job_val) => {
                // Khi có job: spawn task xử lý.
                // Chú ý: vì ta đã đẩy job vào processing_queue, nên job đã "reserved".
                let sem = semaphore.clone();
                let client_clone = client.clone();
                let processing_queue = processing_queue.to_string();
                tokio::spawn(async move {
                    // cố gắng acquire permit -> nếu chưa có slot, await ở đây (job đã nằm trong processing queue)
                    let permit = sem.acquire_owned().await.unwrap();

                    // tạo connection riêng cho task
                    match client_clone.get_async_connection().await {
                        Ok(mut con_task) => {
                            // chạy solve
                            match solve(job_val.clone()).await {
                                Ok(_) => {
                                    // khi thành công: remove job khỏi processing_queue
                                    // dùng LREM 0 job_val -> xóa tất cả các phần tử trùng, hoặc thay đổi số lượng tuỳ ý
                                    if let Err(e) = con_task.lrem(&processing_queue, 0, &job_val).await {
                                        eprintln!("LREM failed after success: {}", e);
                                    }
                                }
                                Err(e) => {
                                    eprintln!("solve() failed: {}", e);
                                    // tùy chiến lược: đẩy job về lại queue để retry
                                    // bạn có thể xử lý retry count để tránh vòng lặp vô hạn
                                    if let Err(e2) = con_task.rpush(job_queue, &job_val).await {
                                        eprintln!("Failed to push job back to queue: {}", e2);
                                    }
                                    if let Err(e3) = con_task.lrem(&processing_queue, 0, &job_val).await {
                                        eprintln!("LREM failed after pushing back: {}", e3);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("failed to get redis connection inside task: {}", e);
                            // nếu không có connection, ta có thể để job nằm trong processing_queue
                            // hoặc cố gắng push nó lại (nếu muốn)
                        }
                    }

                    // release permit khi task kết thúc (drop permit)
                    drop(permit);
                });
            }
            None => {
                // không có job trong timeout 30 phút => lặp lại
                // bạn có thể log/nhúng sleep ngắn nếu muốn
                // e.g. tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}
