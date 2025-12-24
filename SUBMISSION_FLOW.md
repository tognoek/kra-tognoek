# Logic Nạp Bài của Thí Sinh

Tài liệu này mô tả chi tiết luồng xử lý khi một thí sinh nộp bài giải lên hệ thống Online Judge.

## Tổng Quan

Hệ thống nạp bài hoạt động theo mô hình **asynchronous queue-based processing**:
- **Frontend**: Người dùng nhập code và gửi lên server
- **Backend Server**: Nhận submission, lưu vào database, đẩy job vào Redis queue
- **Kra Worker**: Lấy job từ Redis, tải code và test từ S3, compile và chạy test, gửi kết quả về server
- **Database**: Lưu trữ thông tin submission và cập nhật kết quả chấm

---

## Luồng Xử Lý Chi Tiết

### 1. Frontend - SubmitModal Component

**File**: `FE/app/components/SubmitModal.tsx`

#### 1.1. Người dùng nhập code
- Người dùng có 2 cách nhập code:
  - **Paste Code**: Dán trực tiếp code vào textarea
  - **Upload File**: Chọn file `.cpp` hoặc `.c` từ máy tính

#### 1.2. Chọn ngôn ngữ
- Người dùng chọn ngôn ngữ từ dropdown (C hoặc C++)
- Hệ thống load danh sách ngôn ngữ từ `GET /api/languages`

#### 1.3. Submit form
Khi người dùng nhấn "Nộp bài", hàm `handleSubmit` được gọi:

```typescript
// Bước 1: Xác định extension file
const lang = languages.find((l) => l.IdNgonNgu === selectedLanguage);
const langExt = lang?.TenNhanDien === "c" ? "c" : "cpp";

// Bước 2: Tạo filename duy nhất
const timestamp = Date.now();
const username = userData.TenDangNhap || "user";
const filename = `${username}_${timestamp}`;

// Bước 3: Upload code lên S3
const uploadRes = await fetch(`${API_BASE}/api/upload/code`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    code,           // Nội dung code
    filename,       // username_timestamp
    language: langExt, // "c" hoặc "cpp"
  }),
});

// Bước 4: Tạo submission record
const submitRes = await fetch(`${API_BASE}/api/submissions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    IdTaiKhoan: userData.IdTaiKhoan,
    IdDeBai: problemId,
    IdNgonNgu: selectedLanguage,
    IdCuocThi: contestId || null,
    DuongDanCode: uploadData.url, // URL từ S3
  }),
});
```

---

### 2. Backend - Upload Code API

**File**: `Server/src/routes/upload.ts`

#### 2.1. Endpoint: `POST /api/upload/code`

**Input**:
```json
{
  "code": "#include <iostream>...",
  "filename": "user_1234567890",
  "language": "cpp"
}
```

**Xử lý**:
1. Xác định extension: `c` hoặc `cpp`
2. Tạo tên file đầy đủ: `{fileId}.{ext}` (ví dụ: `user_1234567890.cpp`)
3. Tạo FormData với:
   - `file`: Buffer từ code (UTF-8)
   - `name`: fileId (không có extension)
4. Gửi lên S3 service: `POST {S3_BASE_URL}/upload/code`
5. Trả về URL: `{S3_BASE_URL}/data/code/{fileId}.{ext}`

**Output**:
```json
{
  "success": true,
  "filename": "user_1234567890",
  "url": "http://127.0.0.1:3001/data/code/user_1234567890.cpp",
  "message": "File uploaded successfully"
}
```

---

### 3. Backend - Create Submission API

**File**: `Server/src/routes/submissions.ts`

#### 3.1. Endpoint: `POST /api/submissions`

**Input**:
```json
{
  "IdTaiKhoan": "1",
  "IdDeBai": "5",
  "IdNgonNgu": "1",
  "IdCuocThi": null,
  "DuongDanCode": "http://127.0.0.1:3001/data/code/user_1234567890.cpp"
}
```

**Xử lý**:

##### 3.1.1. Validate và lấy thông tin
- Kiểm tra các trường bắt buộc
- Lấy thông tin `DeBai` từ database (kèm `boTests`)
- Lấy thông tin `NgonNgu` từ database
- Validate problem và language tồn tại

##### 3.1.2. Extract Code ID và Test ID
```typescript
// Extract codeId từ URL: /data/code/{codeId}.cpp
const codeIdMatch = DuongDanCode.match(/\/([^\/]+)\.(cpp|c)$/);
const codeId = codeIdMatch ? codeIdMatch[1] : `code_${Date.now()}`;

// Extract testId từ BoTest.DuongDanInput
// Format: http://.../data/test/{testId}.zip
let testId = IdDeBai.toString(); // Fallback
if (problem.boTests.length > 0) {
  const testPath = problem.boTests[0].DuongDanInput || "";
  const testMatch1 = testPath.match(/\/test\/([^\/]+)\//);
  const testMatch2 = testPath.match(/\/test\/([^\/]+)\.zip$/);
  if (testMatch1) testId = testMatch1[1];
  else if (testMatch2) testId = testMatch2[1];
}
```

##### 3.1.3. Tạo Submission Record
```typescript
const submission = await prisma.baiNop.create({
  data: {
    IdTaiKhoan: BigInt(IdTaiKhoan),
    IdDeBai: BigInt(IdDeBai),
    IdNgonNgu: BigInt(IdNgonNgu),
    IdCuocThi: IdCuocThi ? BigInt(IdCuocThi) : null,
    DuongDanCode,
    TrangThaiCham: null, // null = đang chấm
  },
});
```

##### 3.1.4. Đẩy Job vào Redis Queue
```typescript
const jobQueue = getJobQueue();
await jobQueue.addJob({
  task: "judge",
  data: {
    submissionId: submission.IdBaiNop.toString(),
    problemId: IdDeBai.toString(),
    codeId: codeId,                    // "user_1234567890"
    testId: testId,                     // "test_123" hoặc problem ID
    timeLimitMs: problem.GioiHanThoiGian,    // ms
    memoryLimitKb: problem.GioiHanBoNho,    // KB
    inputMode: "stdin",                 // "stdin" hoặc "file"
    language: language.TenNhanDien.toLowerCase(), // "c" hoặc "cpp"
    serverBaseUrl: SERVER_BASE_URL,     // "http://localhost:5000"
  },
});
```

**Output**:
```json
{
  "IdBaiNop": "100",
  "IdTaiKhoan": "1",
  "IdDeBai": "5",
  "IdNgonNgu": "1",
  "IdCuocThi": null,
  "DuongDanCode": "http://127.0.0.1:3001/data/code/user_1234567890.cpp",
  "TrangThaiCham": null,
  "ThoiGianThucThi": null,
  "BoNhoSuDung": null,
  "NgayNop": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. Redis Queue

**File**: `Server/src/redis/jobQueue.ts`

Job được lưu trong Redis queue với format JSON:

```json
{
  "id": "job-1734860000000-abc123xyz",
  "task": "judge",
  "data": {
    "submissionId": "100",
    "problemId": "5",
    "codeId": "user_1234567890",
    "testId": "test_123",
    "timeLimitMs": 1000,
    "memoryLimitKb": 262144,
    "inputMode": "stdin",
    "language": "cpp",
    "serverBaseUrl": "http://localhost:5000"
  },
  "timestamp": 1734860000000
}
```

Kra worker sẽ đọc job từ queue này bằng `BLPOP` (blocking pop).

---

### 5. Kra Worker - Xử Lý Job

**File**: `Kra/src/main.rs`

#### 5.1. Nhận Job từ Redis
```rust
loop {
    let res: Option<(String, String)> = redis::cmd("BLPOP")
        .arg(&queue_name)
        .arg(0)
        .query_async(&mut worker_conn)
        .await;
    
    if let Some((_, job_json)) = res {
        handle_job(&job_json, &s3_base_url).await;
    }
}
```

#### 5.2. Parse Job và Tạo Config
```rust
let env: JobEnvelope = serde_json::from_str(job_json)?;
let data: JudgeData = serde_json::from_value(env.data)?;

let cfg = JobConfig {
    id: data.code_id.clone(),        // "user_1234567890"
    name: data.test_id.clone(),       // "test_123"
    s3_base_url: s3_base_url.to_string(),
    time_limit_ms: data.time_limit_ms,
    memory_limit_kb: data.memory_limit_kb,
    input_mode: InputMode::Stdin,    // hoặc File
    language: Language::Cpp,          // hoặc C
};
```

#### 5.3. Chạy Executor
```rust
let exec_res = Executor::run_job(cfg).await;
```

**Executor thực hiện**:
1. **Tải code từ S3**: `GET {s3_base_url}/data/code/{codeId}.{ext}`
2. **Tải test bundle từ S3**: `GET {s3_base_url}/data/test/{testId}.zip`
3. **Giải nén test.zip**: Extract các file input/output
4. **Compile code**:
   - C: `gcc -o program code.c`
   - C++: `g++ -o program code.cpp`
5. **Chạy từng test case**:
   - Với mỗi test case trong bundle:
     - Chạy program với input
     - So sánh output với expected output
     - Kiểm tra time limit và memory limit
6. **Tổng hợp kết quả**:
   - `compile_ok`: Có compile thành công không?
   - `tests`: Mảng kết quả từng test (passed, time_ms, mem_kb)

#### 5.4. Gửi Callback về Server
```rust
let (status, total_time_ms, total_mem_kb) = summarize_result(&exec_res);

send_callback(
    server_url,           // "http://localhost:5000"
    submission_id,        // "100"
    &exec_res,
    status,               // "accepted", "wrong_answer", "compile_error", ...
    total_time_ms,
    total_mem_kb,
).await;
```

**Callback payload**:
```json
{
  "TrangThaiCham": "accepted",
  "ThoiGianThucThi": 150,
  "BoNhoSuDung": 2048,
  "compileError": null,
  "failedTestIndex": null,
  "totalTests": null
}
```

Hoặc nếu có lỗi:
```json
{
  "TrangThaiCham": "compile_error",
  "ThoiGianThucThi": null,
  "BoNhoSuDung": null,
  "compileError": "error: 'cout' was not declared..."
}
```

Hoặc nếu sai test:
```json
{
  "TrangThaiCham": "wrong_answer",
  "ThoiGianThucThi": 200,
  "BoNhoSuDung": 1024,
  "failedTestIndex": 2,
  "totalTests": 10
}
```

---

### 6. Backend - Callback API

**File**: `Server/src/routes/submissions.ts`

#### 6.1. Endpoint: `POST /api/submissions/:id/callback`

**Input** (từ Kra worker):
```json
{
  "TrangThaiCham": "accepted",
  "ThoiGianThucThi": 150,
  "BoNhoSuDung": 2048,
  "compileError": null,
  "failedTestIndex": null,
  "totalTests": null
}
```

**Xử lý**:
```typescript
// Build status message
let statusMessage = TrangThaiCham;

if (compileError) {
  statusMessage = `compile_error:${compileError}`;
} else if (TrangThaiCham === "accepted") {
  statusMessage = "accepted";
} else if (failedTestIndex !== undefined && totalTests !== undefined) {
  statusMessage = `wrong_answer:${failedTestIndex + 1}/${totalTests}`;
}

// Update submission
const updated = await prisma.baiNop.update({
  where: { IdBaiNop: id },
  data: {
    TrangThaiCham: statusMessage,
    ThoiGianThucThi: ThoiGianThucThi || null,
    BoNhoSuDung: BoNhoSuDung || null,
  },
});
```

**Output**:
```json
{
  "IdBaiNop": "100",
  "TrangThaiCham": "accepted",
  "ThoiGianThucThi": 150,
  "BoNhoSuDung": 2048
}
```

---

## Các Trạng Thái Submission

### Trạng Thái từ Kra Worker

Kra worker gửi callback về server với các trạng thái sau:

#### 1. **Lỗi khi xử lý job (Executor::run_job trả về Err)**
```json
{
  "TrangThaiCham": "error",
  "ThoiGianThucThi": 0,
  "BoNhoSuDung": 0,
  "compileError": "Error message từ Executor"
}
```

#### 2. **Lỗi biên dịch (compile_ok = false)**
```json
{
  "TrangThaiCham": "compile_error",
  "ThoiGianThucThi": 0,
  "BoNhoSuDung": 0,
  "compileError": "Full compile log từ compiler (gcc/g++)"
}
```

#### 3. **Chấp nhận (tất cả test cases đều passed)**
```json
{
  "TrangThaiCham": "accepted",
  "ThoiGianThucThi": 150,        // Thời gian lớn nhất trong các test (ms)
  "BoNhoSuDung": 2048,            // Bộ nhớ lớn nhất trong các test (KB)
  "compileError": null,
  "failedTestIndex": null,
  "totalTests": null
}
```

#### 4. **Sai đáp án (có test case failed)**
```json
{
  "TrangThaiCham": "wrong_answer",
  "ThoiGianThucThi": 200,         // Thời gian lớn nhất trong các test (ms)
  "BoNhoSuDung": 1024,             // Bộ nhớ lớn nhất trong các test (KB)
  "compileError": null,
  "failedTestIndex": 2,            // Index của test case đầu tiên bị sai (0-based)
  "totalTests": 10                // Tổng số test cases
}
```

### Logic Xử Lý trong Kra Worker

#### Hàm `summarize_result()`
```rust
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
```

**Chú ý**: 
- `max_time`: Lấy thời gian lớn nhất trong tất cả các test cases
- `max_mem`: Lấy bộ nhớ lớn nhất trong tất cả các test cases
- Status chỉ có 2 giá trị: `"accepted"` hoặc `"wrong_answer"` (nếu compile thành công)

#### Hàm `send_callback()`
```rust
// Xử lý kết quả chi tiết
match exec_res {
    Err(e) => {
        body["TrangThaiCham"] = "error";
        body["compileError"] = e.to_string();
    }
    Ok(exec) => {
        if !exec.compile_ok {
            body["TrangThaiCham"] = "compile_error";
            body["compileError"] = exec.compile_log;
        } else {
            // Tìm test case đầu tiên bị sai
            let mut failed_index: Option<usize> = None;
            for (idx, test) in exec.tests.iter().enumerate() {
                if !test.passed {
                    failed_index = Some(idx);
                    break;
                }
            }
            
            if let Some(idx) = failed_index {
                body["failedTestIndex"] = idx;           // 0-based index
                body["totalTests"] = exec.tests.len();
            }
        }
    }
}
```

### Trạng Thái Sau Khi Server Xử Lý Callback

Server nhận callback từ Kra và xử lý để tạo status message cuối cùng:

| Trạng Thái Kra Gửi | Server Xử Lý | Trạng Thái Cuối Cùng trong DB |
|-------------------|--------------|------------------------------|
| `error` + `compileError` | `compile_error:${compileError}` | `compile_error:Error message...` |
| `compile_error` + `compileError` | `compile_error:${compileError}` | `compile_error:Full compile log...` |
| `accepted` | `accepted` | `accepted` |
| `wrong_answer` + `failedTestIndex` + `totalTests` | `wrong_answer:${failedTestIndex+1}/${totalTests}` | `wrong_answer:3/10` (1-based) |
| `wrong_answer` (không có index) | `wrong_answer` | `wrong_answer` |

**Lưu ý quan trọng**:
- Kra gửi `failedTestIndex` là **0-based** (test đầu tiên = 0)
- Server lưu vào DB là **1-based** (test đầu tiên = 1) trong format `wrong_answer:3/10`
- Nếu không có `failedTestIndex` hoặc `totalTests`, server chỉ lưu `wrong_answer` đơn giản

### Cấu Trúc ExecResult trong Kra

```rust
pub struct ExecResult {
    pub compile_ok: bool,              // Có compile thành công không?
    pub compile_log: String,            // Log từ compiler (stdout + stderr)
    pub tests: Vec<TestCaseResult>,    // Kết quả từng test case
}

pub struct TestCaseResult {
    pub case_name: String,              // Tên test case (ví dụ: "test1")
    pub passed: bool,                   // Test này pass hay fail?
    pub time_ms: u128,                  // Thời gian chạy (ms)
    pub memory_kb: Option<u64>,         // Bộ nhớ sử dụng (KB), có thể null
    pub checker_exit_ok: bool,          // Checker exit code OK?
    pub stderr: Option<String>,         // Stderr output (có thể chứa "Timeout")
}
```

### Build Result Codes (Nội Bộ)

Kra cũng build một mảng code cho từng test để log (không gửi về server):
```rust
fn build_result_codes(res: &Result<ExecResult, BoxError>) -> Vec<u8> {
    // 0 = đúng
    // 1 = sai
    // 2 = quá thời gian (timeout)
    // 3 = lỗi khác / biên dịch
}
```

Ví dụ: `[0, 0, 1, 2, 0]` nghĩa là:
- Test 1: ✅ Đúng
- Test 2: ✅ Đúng
- Test 3: ❌ Sai
- Test 4: ⏱️ Timeout
- Test 5: ✅ Đúng

---

## Sơ Đồ Luồng

```
┌─────────────┐
│   Frontend  │
│ SubmitModal │
└──────┬──────┘
       │ 1. Upload code
       ▼
┌─────────────────┐
│ POST /upload/code│
│   (Backend)     │
└──────┬──────────┘
       │ 2. Forward to S3
       ▼
┌─────────────┐
│  S3 Service │
│  (Storage)  │
└─────────────┘
       │
       │ 3. Return URL
       ▼
┌──────────────────────┐
│ POST /api/submissions│
│     (Backend)        │
└──────┬───────────────┘
       │
       ├─► 4. Save to DB (TrangThaiCham = null)
       │
       └─► 5. Push to Redis Queue
              │
              ▼
       ┌──────────────┐
       │ Redis Queue  │
       └──────┬───────┘
              │ 6. BLPOP
              ▼
       ┌──────────────┐
       │ Kra Worker   │
       └──────┬───────┘
              │
              ├─► 7. Fetch code from S3
              ├─► 8. Fetch test.zip from S3
              ├─► 9. Compile code
              ├─► 10. Run tests
              │
              ▼
       ┌──────────────────────────┐
       │ POST /submissions/:id/    │
       │        callback           │
       │      (Backend)            │
       └──────┬───────────────────┘
              │
              ▼
       ┌──────────────┐
       │   Database   │
       │   (Update)   │
       └──────────────┘
```

---

## Các File Liên Quan

### Frontend
- `FE/app/components/SubmitModal.tsx` - Component form nộp bài
- `FE/app/problems/[id]/page.tsx` - Trang chi tiết bài, tích hợp SubmitModal

### Backend
- `Server/src/routes/submissions.ts` - API endpoints cho submissions
- `Server/src/routes/upload.ts` - API upload code và test lên S3
- `Server/src/redis/jobQueue.ts` - Redis queue management

### Worker
- `Kra/src/main.rs` - Entry point của Kra worker
- `Kra/src/tog/mod.rs` - Module chính xử lý job
- `Kra/src/tog/fetch.rs` - Tải code và test từ S3
- `Kra/src/tog/run.rs` - Compile và chạy test
- `Kra/src/tog/types.rs` - Định nghĩa types và configs

### Database
- `MySQL/code.sql` - Schema database (bảng `BaiNop`, `DeBai`, `BoTest`)

---

## Lưu Ý Quan Trọng

1. **Asynchronous Processing**: Submission được xử lý bất đồng bộ, không block user
2. **Error Handling**: Nếu Redis queue fail, submission vẫn được tạo nhưng không được chấm ngay
3. **Test ID Extraction**: Test ID được extract từ `BoTest.DuongDanInput`, fallback về `problemId` nếu không match
4. **Code ID Extraction**: Code ID được extract từ URL path, fallback về `code_${timestamp}` nếu không match
5. **BigInt Serialization**: Tất cả BigInt được convert sang string khi trả về JSON
6. **Status Message Format**: Status có thể là string đơn giản hoặc format `type:detail` (ví dụ: `wrong_answer:3/10`)

---

## Cải Tiến Có Thể

1. **Polling Status**: Frontend có thể poll `/api/submissions/:id` để cập nhật status real-time
2. **WebSocket**: Thay polling bằng WebSocket để push kết quả về client ngay lập tức
3. **Retry Mechanism**: Retry job nếu Kra worker fail
4. **Priority Queue**: Ưu tiên chấm submissions của contest đang diễn ra
5. **Batch Processing**: Xử lý nhiều submissions cùng lúc để tối ưu hiệu suất

