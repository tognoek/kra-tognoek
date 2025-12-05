# Kra Worker (Rust/Tokio)

Worker nhận job từ Redis, tải code/test từ S3, compile & chạy test, trả kết quả về Server.

## Yêu cầu
- Rust 1.70+
- Redis 6+

## Chạy nhanh
```bash
cargo run
```

## Cấu hình
- Redis URL hiện hardcode: `redis://127.0.0.1/` (xem `src/main.rs`)
- Module chính: `src/tog/`
  - `fetch.rs`: tải và giải nén bundle từ S3
  - `run.rs`: compile C++ và chạy test
  - `types.rs`: định nghĩa JobConfig, ExecResult, ...

## Luồng xử lý
1) Nhận job từ Redis queue
2) Tải code `.cpp` và test `.zip` từ S3
3) Giải nén, tìm code, checker, test cases
4) Compile C++ (g++)
5) Chạy từng test với giới hạn thời gian/bộ nhớ
6) Tính kết quả, gọi callback về Server (`/api/submissions/:id/callback`)

## Ghi chú
- Thời gian/bộ nhớ hiện cấu hình trong code (`run.rs`), có thể điều chỉnh.
- Cần đảm bảo S3 service đang chạy và truy cập được các đường dẫn code/test.

