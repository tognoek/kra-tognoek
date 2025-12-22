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
- Redis URL: lấy từ biến môi trường `REDIS_URL`, mặc định `redis://127.0.0.1:6379`
- Queue: lấy từ `REDIS_QUEUE`, mặc định `job_queue`
- S3 base URL: lấy từ `S3_BASE_URL`, mặc định `http://127.0.0.1:3001`

- Module chính: `src/tog/`
  - `fetch.rs`: tải và giải nén bundle từ S3
  - `run.rs`: compile C/C++ và chạy test
  - `types.rs`: định nghĩa JobConfig, ExecResult, InputMode, Language, ...

## Luồng xử lý
1) Nhận job từ Redis queue
2) Tải code (`.c` hoặc `.cpp`) và test `.zip` từ S3
3) Giải nén, tìm code, checker, test cases
4) Compile C (gcc) hoặc C++ (g++) theo trường `language`
5) Chạy từng test với giới hạn thời gian/bộ nhớ
6) Tính kết quả, gọi callback về Server (`/api/submissions/:id/callback`)

## Job mẫu trong Redis

Kra đọc job từ Redis ở dạng JSON, bọc trong `JobEnvelope` giống bên Server (`Server/src/redis/jobQueue.ts`):

```json
{
  "id": "job-1734860000000-abc123xyz",
  "task": "judge",
  "data": {
    "codeId": "1",                // id code - dùng để map sang đường dẫn code trong S3
    "testId": "sum",              // id bộ test - dùng để map sang bundle test trong S3
    "timeLimitMs": 1000,          // giới hạn thời gian mỗi test (ms)
    "memoryLimitKb": 262144,      // giới hạn RAM (KB)
    "inputMode": "stdin",         // "stdin" hoặc "file"
    "language": "cpp"             // "c" hoặc "cpp" (mặc định cpp nếu thiếu)
  },
  "timestamp": 1734860000000
}
```

- Trường `language` quyết định compiler:
  - `"c"`  → Kra dùng `gcc -std=c11 -O2` để biên dịch.
  - `"cpp"` hoặc thiếu → Kra dùng `g++ -std=c++17 -O2` để biên dịch.

Nếu muốn tự test nhanh, bạn có thể `RPUSH` job này vào queue `job_queue` trong Redis:

```bash
redis-cli RPUSH job_queue '{
  "id": "job-manual-1",
  "task": "judge",
  "data": {
    "codeId": "1",
    "testId": "sum",
    "timeLimitMs": 1000,
    "memoryLimitKb": 262144,
    "inputMode": "stdin",
    "language": "cpp"
  },
  "timestamp": 1734860000000
}'
```

## Ghi chú
- Thời gian/bộ nhớ hiện cấu hình trong code (`run.rs`), có thể điều chỉnh.
- Cần đảm bảo S3 service đang chạy và truy cập được các đường dẫn code/test.

