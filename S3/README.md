# S3 Service (Rust/Axum)

File storage microservice để upload/download code và test.

## Yêu cầu
- Rust 1.70+

## Chạy nhanh
```bash
cargo run
```

Mặc định lắng nghe `http://127.0.0.1:3000`.

## Env
Copy và chỉnh sửa nếu cần:
```
cp env.example .env
ENABLE_CONSOLE_OUTPUT=true   # tắt = false
MAXCALL=100000000000000
```

## Endpoints
- `GET /download?id=<id>&name=<name>`: tải zip theo id/name trong `data/test`.
- `POST /upload/code`: multipart `file` (.cpp) và `filename`.
- `POST /upload/test`: multipart `file` (.zip) và `filename`.
- `GET /` hoặc `/upload.html`: trang upload.

## Thư mục dữ liệu
- `data/code`: lưu `.cpp`
- `data/test`: lưu `.zip`

## Ghi chú
- Đã bật Axum multipart (axum 0.7, feature `multipart`).
- Bảng thống kê console có thể tắt bằng env ở trên.

