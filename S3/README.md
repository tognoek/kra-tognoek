# S3 Service (Rust/Axum)

File storage microservice để upload/download code và test.

## Yêu cầu
- Rust 1.70+

## Chạy nhanh
```bash
cargo run
```

Mặc định lắng nghe `http://127.0.0.1:3001`.

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

## Cấu trúc file zip test (cho Kra worker)

Mỗi bài toán sẽ có một file test:
- `data/test/<testId>.zip`

### Ví dụ tree bên trong `<testId>.zip`

Ví dụ bài `sum` có 3 test (`test1`, `test2`, `test3`) và 1 checker chung:

```text
sum.zip
├── check.cpp
│
├── test1/
│   ├── sum.inp
│   └── sum.out
│
├── test2/
│   ├── sum.inp
│   └── sum.out
│
└── test3/
    ├── sum.inp
    └── sum.out
```

Kra sau khi tải zip về sẽ giải nén và:

- **File input/output cho từng test:**
  - Các file input có đuôi `.inp`:
    - `test1/sum.inp`, `test2/sum.inp`, `test3/sum.inp`, ...
  - Với mỗi file `X.inp`, nếu tồn tại file `X.out` cùng thư mục thì:
    - `X.inp` là input,
    - `X.out` là output đúng tương ứng.
  - Vị trí các file `.inp/.out` có thể ở bất kỳ thư mục con nào (`test1/`, `test2/`, ...),
    Kra sẽ tự quét toàn bộ và sort theo đường dẫn.

- **File checker (tuỳ chọn):**
  - Nếu trong zip có file tên chính xác `check.cpp` (ở bất kỳ thư mục nào),
    Kra sẽ:
    - biên dịch `check.cpp`,
    - đối với mỗi test `X`:
      - ghi output của thí sinh vào file `X-sv.out` cùng thư mục với `X.inp`,
      - chạy checker với 3 tham số: `check <X.inp> <X-sv.out> <X.out>`.
    - `check.cpp` in `1` (đúng) hoặc `0` (sai) ra `stdout` cho từng test.

- **Tổng quát:**
  - S3 không áp đặt chặt chẽ tên thư mục bên trong zip, chỉ cần:
    - tên file code trên S3: `data/code/<codeId>.cpp`
    - tên file test: `data/test/<testId>.zip`
  - Kra sẽ gọi `GET /download?id=<codeId>&name=<testId>` để lấy 1 file zip tổng hợp
    chứa cả code thí sinh và bộ test ở trên.

## Ghi chú
- Đã bật Axum multipart (axum 0.7, feature `multipart`).
- Bảng thống kê console có thể tắt bằng env ở trên.

