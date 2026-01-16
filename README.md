# Kra-tognoek – Online Judge System

Hệ thống chấm bài tự động (Online Judge) với kiến trúc microservices, hỗ trợ nộp bài, chấm tự động, tổ chức cuộc thi, blog/bài đăng và hệ thống thống kê phong phú.

---

## 📑 Mục lục

1. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
2. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
3. [Cài đặt và Cấu hình](#-cài-đặt-và-cấu-hình)
4. [API Endpoints](#-api-endpoints)
5. [Logic chi tiết các Service](#-logic-chi-tiết-các-service)
6. [Giao diện Client](#-giao-diện-client)
7. [Luồng hoạt động](#-luồng-hoạt-động)
8. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
9. [Database Schema](#-database-schema)
10. [Development Guide](#-development-guide)
11. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Kiến trúc hệ thống

Hệ thống được xây dựng theo kiến trúc **microservices** với 5 services chính:

### 1. **S3 Service** (`S3/`)
- **Ngôn ngữ**: Rust + Axum
- **Chức năng**: File storage service
  - Upload/download code files (.cpp, .c)
  - Upload/download test cases (.zip)
  - Merge code và test cases thành bundle
  - Thống kê tài nguyên (CPU, RAM, Disk, Time)
  - Monitoring và resource tracking
- **Port**: `3001`
- **Endpoints**: `/upload/code`, `/upload/test`, `/download`, `/download/code`, `/download/test`

### 2. **Kra Service** (`Kra/`)
- **Ngôn ngữ**: Rust + Tokio + Axum
- **Chức năng**: Worker chấm bài + Web UI
  - **Worker**: 
    - Nhận job từ Redis queue
    - Tải bundle (code + test) từ S3
    - Compile code (C/C++)
    - Chạy test cases với checker
    - Đo thời gian và bộ nhớ
    - Gửi callback về Server
  - **Web UI**: Form tạo job thủ công để test (`http://127.0.0.1:4000`)
- **Port**: `4000` (Web UI), Worker chạy background
- **Dependencies**: Redis, S3, Server (callback)

### 3. **Ark Service** (`Ark/`)
- **Ngôn ngữ**: Rust + Tokio
- **Chức năng**: AI Moderation Service
  - Quét bình luận mới trong 24h
  - Gửi batch requests đến OpenAI Moderation API
  - Tự động ẩn bình luận vi phạm
  - Chạy theo chu kỳ 24h
- **Dependencies**: MySQL, OpenAI API Key

### 4. **Server** (`Server/`)
- **Ngôn ngữ**: Node.js + Express + TypeScript
- **Chức năng**: REST API Backend
  - Quản lý Users, Problems, Contests, Submissions
  - Authentication & Authorization (JWT)
  - Redis Job Queue management
  - Database operations (Prisma ORM)
  - File upload proxy (gửi đến S3)
  - Comments, Posts, Languages, Topics management
  - Admin & Creator APIs
  - Ranking & Statistics
- **Port**: `5000`
- **Database**: MySQL (Prisma)
- **Queue**: Redis

### 5. **Client** (`Client/`)
- **Framework**: Next.js 16 (App Router) + React 18
- **Chức năng**: Frontend Web Application
  - Giao diện người dùng (thí sinh)
  - Giao diện Admin
  - Giao diện Creator (tạo contest/problem)
  - Real-time submission status
  - Markdown rendering với Math support
  - Code editor với syntax highlighting
- **Port**: `3000` (Next.js dev server)

### Luồng giao tiếp

```
Client → Server → Redis → Kra → S3 → Kra → Server → Client
```

---

## 📋 Yêu cầu hệ thống

### Phần mềm cần thiết

#### 1. Rust (1.70+)
Để build S3, Kra và Ark services:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
```

#### 2. Node.js (18+)
Để chạy Server và Client:
```bash
# Dùng nvm (khuyến nghị)
nvm install 18
nvm use 18

# Hoặc tải từ nodejs.org
```

#### 3. MySQL (8.0+)
Database chính:
- **Windows**: [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- **Linux**: `sudo apt-get install mysql-server`
- **Mac**: `brew install mysql`

#### 4. Redis (6.0+)
Job queue cho Kra worker:
- **Windows**: [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- **Linux**: `sudo apt-get install redis-server`
- **Mac**: `brew install redis`

#### 5. Isolate (Khuyến nghị)
Sandbox environment để chạy code an toàn:
```bash
sudo apt update
sudo apt install -y build-essential libcap-dev git
git clone https://github.com/ioi/isolate.git
cd isolate
make
sudo make install
```

Kiểm tra cài đặt:
```bash
which isolate
# => /usr/local/bin/isolate
```

Cấp quyền:
```bash
sudo chown root:root /usr/local/bin/isolate
sudo chmod u+s /usr/local/bin/isolate
```

#### 6. Compiler
- **g++** (C++17): Để compile C++ code
- **gcc** (C11): Để compile C code

Kiểm tra:
```bash
g++ --version
gcc --version
```

---

## 🚀 Cài đặt và Cấu hình

### 1. Clone Repository

```bash
git clone <repository-url>
cd kra-tognoek
```

### 2. Cấu hình Database

#### Khởi động MySQL:
```bash
# Linux
sudo systemctl start mysql
sudo systemctl status mysql

# Windows: Start MySQL Service từ Services
# Mac: brew services start mysql
```

#### Khởi động Redis:
```bash
# Linux
sudo systemctl start redis-server
redis-cli ping  # Kiểm tra: nên trả về PONG

# Windows: Start Redis service
# Mac: brew services start redis
```

#### Backup Database (tùy chọn):
```bash
mysqldump -u [username] -p [database_name] > backup_file.sql
```

#### Truy cập MySQL UI:
- **phpMyAdmin**: `http://localhost/phpmyadmin/` (nếu đã cài)
- **MySQL Workbench**: GUI tool
- **Prisma Studio**: `npx prisma studio` (sau khi setup)

### 3. Cấu hình Environment Variables

#### S3 Service (`S3/.env`):
```bash
cd S3
cp env.example .env
```

Chỉnh sửa `.env`:
```env
# Bật/tắt console output (thống kê real-time)
ENABLE_CONSOLE_OUTPUT=true

# Giới hạn số lần gọi trước khi reset stats
MAXCALL=100000000000000
```

#### Server (`Server/.env`):
```bash
cd Server
cp env.example .env
```

Chỉnh sửa `.env`:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/oj_system"

# Redis
REDIS_URL="redis://127.0.0.1:6379"
REDIS_QUEUE="job_queue"

# JWT Secret
JWT_SECRET="your-secret-key-change-in-production"

# Server Base URL (cho callback)
SERVER_BASE_URL="http://localhost:5000"

# Worker Secret (cho callback authentication)
WORKER_SECRET="your-worker-secret"

# S3 Base URL
S3_BASE_URL="http://127.0.0.1:3001"

# Email (nếu dùng Resend)
RESEND_API_KEY="your-resend-api-key"
```

#### Ark Service (`Ark/.env`):
```bash
cd Ark
cp env.example .env
```

Chỉnh sửa `.env`:
```env
DATABASE_URL="mysql://user:password@localhost:3306/oj_system"
OPENAI_API_KEY="your-openai-api-key"
```

#### Client (`Client/.env.local`):
```env
NEXT_PUBLIC_API_BASE="http://localhost:5000"
```

### 4. Setup Database Schema

```bash
cd Server
npm install
npx prisma generate
npx prisma migrate dev --name init
```

Nếu cần reset:
```bash
npx prisma migrate reset
npx prisma generate
```

### 5. Install Dependencies

#### Server:
```bash
cd Server
npm install
```

#### Client:
```bash
cd Client
npm install
```

#### Rust Services:
Dependencies tự động khi build:
```bash
cd S3
cargo build --release

cd ../Kra
cargo build --release

cd ../Ark
cargo build --release
```

### 6. Chạy Services

#### Cách 1: Chạy tất cả (Script)
```bash
# Linux/Mac
./run-all.sh

# Windows
run-all.bat
```

#### Cách 2: Chạy từng service riêng

**Terminal 1 - S3 Service:**
```bash
cd S3
cargo run
# Server chạy tại http://127.0.0.1:3001
```

**Terminal 2 - Kra Worker:**
```bash
cd Kra
cargo run
# Web UI: http://127.0.0.1:4000
# Worker: Chạy background, nhận job từ Redis
```

**Terminal 3 - Ark Service (tùy chọn):**
```bash
cd Ark
cargo run
# Chạy background, quét bình luận mỗi 24h
```

**Terminal 4 - Server API:**
```bash
cd Server
npm run dev
# Server chạy tại http://localhost:5000
```

**Terminal 5 - Client:**
```bash
cd Client
npm run dev
# Frontend chạy tại http://localhost:3000
```

---

## 🌐 Ports và URLs

Sau khi chạy, các services sẽ chạy trên:

| Service | URL | Mô tả |
|---------|-----|-------|
| **Client** | `http://localhost:3000` | Frontend web UI |
| **Server API** | `http://localhost:5000/api` | REST API backend |
| **S3** | `http://127.0.0.1:3001` | File storage service |
| **Kra Web UI** | `http://127.0.0.1:4000` | Test UI cho Kra worker |
| **Kra Worker** | Background | Worker chấm bài (không có HTTP server) |
| **Ark** | Background | AI moderation service |

---

## 📡 API Endpoints

### S3 Service

Base URL: `http://127.0.0.1:3001`

| Method | Endpoint | Mô tả | Parameters |
|--------|----------|-------|------------|
| `GET` | `/` hoặc `/upload.html` | Trang upload HTML | - |
| `POST` | `/upload/code` | Upload file .cpp/.c | `multipart/form-data`: `file`, `name` |
| `POST` | `/upload/test` | Upload file .zip test cases | `multipart/form-data`: `file`, `name` |
| `GET` | `/download` | Download bundle (code + test) | `?id=<code_id>&name=<test_id>` |
| `GET` | `/download/code` | Download code file | `?id=<code_id>` |
| `GET` | `/download/test` | Download test file | `?id=<test_id>` |

### Server API

Base URL: `http://localhost:5000/api`

#### Authentication (`/api/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/auth/register` | Đăng ký tài khoản mới | ❌ |
| `POST` | `/auth/login` | Đăng nhập | ❌ |
| `POST` | `/auth/check-availability` | Kiểm tra username/email đã tồn tại | ❌ |
| `POST` | `/auth/sync-verify` | Đồng bộ trạng thái xác thực email | ❌ |
| `PUT` | `/auth/change-password` | Đổi mật khẩu | ✅ |
| `POST` | `/auth/forgot-password` | Quên mật khẩu | ❌ |
| `GET` | `/auth/me` | Lấy thông tin user hiện tại | ✅ |

#### Users (`/api/users`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/users` | Lấy danh sách users | ❌ |
| `GET` | `/users/:id` | Lấy chi tiết user (với stats) | ❌ |
| `POST` | `/users` | Tạo user mới | ❌ |
| `PUT` | `/users/:id` | Cập nhật thông tin user | ✅ |

#### Problems (`/api/problems`)

| Method | Endpoint | Mô tả | Query Params |
|--------|----------|-------|--------------|
| `GET` | `/problems` | Lấy danh sách problems | `page`, `limit`, `q`, `topics`, `difficulty` |
| `GET` | `/problems/:id` | Lấy chi tiết problem | - |
| `POST` | `/problems` | Tạo problem mới | - |

#### Contests (`/api/contests`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/contests` | Lấy danh sách contests | ❌ |
| `GET` | `/contests/:id` | Lấy chi tiết contest | ❌ |
| `GET` | `/contests/:id/submissions` | Lấy submissions của contest | ❌ |
| `GET` | `/contests/:contestId/problems/:problemId` | Lấy problem trong contest | ❌ |
| `POST` | `/contests/:id/register` | Đăng ký contest | ✅ |
| `PUT` | `/contests/:id/unregister` | Hủy đăng ký contest | ✅ |

#### Submissions (`/api/submissions`)

| Method | Endpoint | Mô tả | Query Params |
|--------|----------|-------|--------------|
| `GET` | `/submissions` | Lấy danh sách submissions | `page`, `limit`, `q`, `status`, `problemId`, `userId`, `contestId` |
| `GET` | `/submissions/:id` | Lấy chi tiết submission | - |
| `GET` | `/submissions/stats/:userId` | Lấy thống kê submissions | `groupBy` (day/month/year) |
| `POST` | `/submissions` | Nộp bài mới | - |
| `POST` | `/submissions/:id/callback` | Callback từ Kra worker (internal) | Header: `x-worker-key` |

#### Languages (`/api/languages`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/languages` | Lấy danh sách ngôn ngữ (với stats) |
| `POST` | `/languages` | Tạo ngôn ngữ mới (Admin) |
| `PUT` | `/languages/:id` | Cập nhật ngôn ngữ (Admin) |

#### Topics (`/api/topics`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/topics` | Lấy danh sách topics/chủ đề |
| `POST` | `/topics` | Tạo topic mới (Admin) |

#### Comments (`/api/comments`)

| Method | Endpoint | Mô tả | Query Params |
|--------|----------|-------|--------------|
| `GET` | `/comments` | Lấy comments của problem | `problemId` |
| `POST` | `/comments` | Tạo comment mới | - |

#### Posts (`/api/posts`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/posts/public` | Lấy bài đăng công khai | ❌ |
| `GET` | `/posts/manage` | Lấy bài đăng để quản lý | ✅ (Admin/Creator) |
| `POST` | `/posts` | Tạo bài đăng mới | ✅ |
| `PUT` | `/posts/:id` | Cập nhật bài đăng | ✅ |

#### Upload (`/api/upload`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/upload/code` | Upload code file (proxy đến S3) |
| `POST` | `/upload/test` | Upload test file (proxy đến S3) |

#### Home/Stats (`/api/home`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/home` | Lấy thống kê trang chủ (top users, top problems) |

#### Rank (`/api/ranks`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/ranks/:id` | Lấy bảng xếp hạng contest |

#### Admin (`/api/admin`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/admin/users` | Quản lý users | ✅ Admin |
| `PUT` | `/admin/users/:id` | Cập nhật user | ✅ Admin |
| `DELETE` | `/admin/users/:id` | Vô hiệu hóa user | ✅ Admin |

#### Creator (`/api/creator_contest`, `/api/creator_problem`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/creator_contest/by-user/:userId` | Lấy contests của creator | ✅ |
| `GET` | `/creator_contest/contests/:id` | Chi tiết contest (creator) | ✅ |
| `POST` | `/creator_contest` | Tạo contest mới | ✅ |
| `PUT` | `/creator_contest/:id` | Cập nhật contest | ✅ |
| `POST` | `/creator_contest/:id/problems` | Thêm problem vào contest | ✅ |
| `DELETE` | `/creator_contest/:id/problems` | Xóa problem khỏi contest | ✅ |
| `PUT` | `/creator_contest/:id/kick` | Loại thí sinh khỏi contest | ✅ |
| `GET` | `/creator_problem/available` | Lấy problems của creator | ✅ |
| `POST` | `/creator_problem` | Tạo problem mới | ✅ |
| `PUT` | `/creator_problem/:id` | Cập nhật problem | ✅ |

#### Health (`/api/health`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/health` | Health check endpoint |

---

## 🔧 Logic chi tiết các Service

### S3 Service

#### 1. Upload Code (`/upload/code`)
- Nhận multipart form với `file` và `name`
- Validate filename (chỉ alphanumeric, `_`, `-`)
- Lưu file vào `data/code/{name}.cpp`
- Trả về status và file path

#### 2. Upload Test (`/upload/test`)
- Nhận multipart form với `file` (zip) và `name`
- Validate file là zip hợp lệ (check signature)
- Lưu file vào `data/test/{name}.zip`
- Trả về status

#### 3. Download Bundle (`/download`)
- Merge test zip và code file thành bundle mới
- Trả về zip file chứa:
  - Tất cả files từ test zip
  - Code file trong thư mục `code/`

#### 4. Monitor & Stats
- **Monitor**: Theo dõi CPU, RAM, Disk, Time cho mỗi request
- **Stats Pool**: Tổng hợp thống kê:
  - Total calls, Average/Max CPU, RAM, Disk, Time
  - Console output (có thể tắt bằng `ENABLE_CONSOLE_OUTPUT=false`)
  - Interval update: 2000ms (configurable)

### Kra Service

#### 1. Worker Process
- **Redis Consumer**: Dùng `BLPOP` để nhận job từ queue
- **Job Format**:
  ```json
  {
    "id": "job_id",
    "task": "judge",
    "data": {
      "submissionId": "...",
      "problemId": "...",
      "codeId": "...",
      "testId": "...",
      "timeLimitMs": 1000,
      "memoryLimitKb": 256000,
      "inputMode": "stdin" | "file",
      "language": "cpp" | "c",
      "serverBaseUrl": "http://localhost:5000"
    },
    "timestamp": 1234567890
  }
  ```

#### 2. Execution Flow
1. **Download Bundle**: Tải bundle từ S3 (`/download?id={codeId}&name={testId}`)
2. **Unzip Bundle**: Giải nén vào temp directory
3. **Find Files**:
   - Code file: `code/{codeId}.cpp` hoặc `code/{codeId}.c`
   - Checker: `check.cpp` (nếu có)
   - Test cases: Tất cả files `.inp` và `.res`
4. **Compile**:
   - Submission: `g++ -std=c++17 -O2` hoặc `gcc -std=c11 -O2`
   - Checker: `g++ -std=c++17 -O2` (nếu có)
5. **Run Tests**:
   - Với mỗi test case:
     - Chạy submission binary với input
     - Monitor memory usage (Linux: `/proc/{pid}/status`)
     - Timeout: `time_limit_ms`
     - Memory limit: `memory_limit_kb`
     - So sánh output với checker hoặc file `.res`
6. **Result Codes**:
   - `-1`: Compile error
   - `0`: Accepted
   - `1`: Wrong Answer
   - `2`: Time Limit Exceeded
   - `3`: Memory Limit Exceeded
7. **Callback**: Gửi kết quả về Server (`POST /api/submissions/{id}/callback`)

#### 3. Web UI
- Form để tạo job thủ công
- Test Kra worker không cần qua Server
- URL: `http://127.0.0.1:4000`

### Ark Service

#### 1. AI Moderation
- **Chu kỳ**: Quét mỗi 24 giờ
- **Process**:
  1. Query comments mới trong 24h (`TrangThai = 1 AND NgayTao > one_day_ago`)
  2. Chia thành batch 16 comments
  3. Gửi đến OpenAI Moderation API
  4. Nếu `flagged = true`: Set `TrangThai = 0`
- **Dependencies**: OpenAI API Key

---

## 🎨 Giao diện Client

### Cấu trúc Pages

#### Public Pages
- **`/`**: Trang chủ (posts, top users, top problems)
- **`/problems`**: Danh sách bài tập (filter, search, pagination)
- **`/problems/[id]`**: Chi tiết bài tập (submit code, comments)
- **`/contests`**: Danh sách cuộc thi
- **`/contests/[id]`**: Chi tiết cuộc thi
- **`/contests/[id]/[prb]`**: Problem trong contest
- **`/contests/[id]/rank`**: Bảng xếp hạng
- **`/contests/[id]/submissions`**: Submissions của contest
- **`/submissions`**: Danh sách bài nộp (real-time polling)
- **`/languages`**: Thống kê ngôn ngữ
- **`/users/[id]`**: Profile user
- **`/profile`**: Profile của mình

#### Auth Pages
- **`/auth/login`**: Đăng nhập
- **`/auth/register`**: Đăng ký

#### Admin Pages (`/admin`)
- **`/admin`**: Dashboard
- **`/admin/users`**: Quản lý users
- **`/admin/languages`**: Quản lý ngôn ngữ
- **`/admin/topics`**: Quản lý topics
- **`/admin/posts`**: Quản lý bài đăng

#### Creator Pages (`/creator`)
- **`/creator`**: Dashboard creator
- **`/creator/problems`**: Quản lý problems
- **`/creator/problems/create`**: Tạo problem mới
- **`/creator/problems/[id]`**: Chỉnh sửa problem
- **`/creator/contests`**: Quản lý contests
- **`/creator/contests/create`**: Tạo contest mới
- **`/creator/contests/[id]`**: Quản lý contest
- **`/creator/posts`**: Quản lý posts

### Components

- **`Navbar`**: Navigation bar với auth status
- **`AuthBar`**: Login/Register/Profile button
- **`SubmitModal`**: Modal nộp bài (code editor)
- **`StatusBadge`**: Badge trạng thái submission
- **`DifficultyBadge`**: Badge độ khó problem
- **`CommentsSection`**: Section bình luận
- **`SearchBar`**: Search component
- **`ContributionGraph`**: Graph thống kê submissions

### Features

- **Real-time Updates**: Polling submissions mỗi 10s
- **Markdown Support**: Render markdown với Math (KaTeX)
- **Code Highlighting**: Syntax highlighting với Prism.js
- **Responsive Design**: Mobile-friendly
- **Dark Mode**: (Có thể thêm)

---

## 🔄 Luồng hoạt động

### 1. User nộp bài

```
1. User mở problem page (/problems/[id])
2. Nhập code vào editor
3. Chọn ngôn ngữ (C/C++)
4. Click "Nộp bài"
5. Client gửi POST /api/upload/code → Server
6. Server upload code lên S3
7. Server tạo submission record (TrangThaiCham = null)
8. Server push job vào Redis queue
9. Client hiển thị "Đang chấm..."
```

### 2. Kra Worker xử lý

```
1. Kra worker nhận job từ Redis (BLPOP)
2. Download bundle từ S3 (/download?id={codeId}&name={testId})
3. Unzip bundle vào temp directory
4. Find code file và test cases
5. Compile code (g++/gcc)
6. Với mỗi test case:
   - Chạy binary với input
   - Monitor memory và time
   - So sánh output với checker/.res
   - Ghi nhận kết quả (0/1/2/3)
7. Tổng hợp kết quả
8. Gửi callback về Server (POST /api/submissions/{id}/callback)
```

### 3. Server cập nhật

```
1. Server nhận callback từ Kra
2. Validate worker key (x-worker-key header)
3. Cập nhật submission:
   - TrangThaiCham: JSON array [0,0,1,2,0]
   - ThoiGianThucThi: max time (ms)
   - BoNhoSuDung: max memory (KB)
   - compileError: (nếu có)
```

### 4. Client hiển thị kết quả

```
1. Client polling GET /api/submissions mỗi 10s
2. Khi TrangThaiCham != null:
   - Parse JSON array
   - Hiển thị status: Accepted/Wrong Answer/Time Limit/Memory Limit/Compile Error
   - Hiển thị thời gian và bộ nhớ
   - Highlight dòng của mình trong table
```

### 5. Contest Flow

```
1. Creator tạo contest (/creator/contests/create)
2. Thêm problems vào contest
3. User đăng ký contest (/contests/[id])
4. Khi contest bắt đầu:
   - User có thể nộp bài
   - Submissions được gắn IdCuocThi
5. Xem bảng xếp hạng (/contests/[id]/rank)
   - Tính điểm: số problems solved
   - Sort: điểm → thời gian giải đầu tiên → tổng thời gian
```

---

## 📁 Cấu trúc thư mục

```
Kra-tognoek/
├── S3/                          # File storage service (Rust)
│   ├── src/
│   │   ├── main.rs             # Axum server, routes
│   │   ├── stats.rs            # Statistics tracking
│   │   ├── pool.rs             # Stats pool management
│   │   └── monitor.rs          # Resource monitoring (CPU, RAM, Disk)
│   ├── data/
│   │   ├── code/               # Lưu trữ file .cpp/.c
│   │   └── test/               # Lưu trữ file .zip test cases
│   ├── upload.html             # HTML upload page
│   ├── env.example             # Environment variables template
│   └── Cargo.toml              # Rust dependencies
│
├── Kra/                         # Worker service (Rust)
│   ├── src/
│   │   ├── main.rs             # Redis consumer + Web UI
│   │   └── tog/                # Test execution module
│   │       ├── mod.rs          # Executor orchestrator
│   │       ├── fetch.rs        # Fetch files from S3
│   │       ├── run.rs          # Compile & run code
│   │       └── types.rs        # Type definitions
│   ├── ui/
│   │   └── index.html          # Web UI form
│   ├── env.example             # Environment variables template
│   └── Cargo.toml              # Rust dependencies
│
├── Ark/                         # AI Moderation service (Rust)
│   ├── src/
│   │   └── main.rs             # Comment moderation loop
│   ├── env.example             # Environment variables template
│   └── Cargo.toml              # Rust dependencies
│
├── Server/                      # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── main.ts             # Express server setup
│   │   ├── db.ts               # Prisma client
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT authentication middleware
│   │   ├── redis/
│   │   │   ├── main.ts         # Redis connection & job queue
│   │   │   └── jobQueue.ts     # Job queue manager
│   │   ├── routes/
│   │   │   ├── index.ts        # Router tổng hợp
│   │   │   ├── auth.ts         # Authentication routes
│   │   │   ├── users.ts        # User routes
│   │   │   ├── problems.ts     # Problem routes
│   │   │   ├── contests.ts     # Contest routes
│   │   │   ├── submissions.ts  # Submission routes
│   │   │   ├── languages.ts    # Language routes
│   │   │   ├── topics.ts       # Topic routes
│   │   │   ├── comments.ts     # Comment routes
│   │   │   ├── posts.ts        # Post routes
│   │   │   ├── upload.ts       # Upload proxy routes
│   │   │   ├── home.ts         # Home stats routes
│   │   │   ├── rank.ts         # Ranking routes
│   │   │   ├── admin.ts        # Admin routes
│   │   │   ├── creatorContest.ts  # Creator contest routes
│   │   │   ├── creatorProblem.ts  # Creator problem routes
│   │   │   └── health.ts       # Health check
│   │   └── scripts/
│   │       ├── avatar.ts       # Avatar URL generator
│   │       ├── mail.ts         # Email sending
│   │       ├── scan.ts         # Content scanning
│   │       └── seed.ts         # Database seeding
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Migration files
│   ├── env.example             # Environment variables template
│   ├── package.json            # Node.js dependencies
│   └── tsconfig.json           # TypeScript config
│
├── Client/                      # Frontend (Next.js)
│   ├── app/
│   │   ├── layout.tsx          # Root layout với Navbar
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx    # Login page
│   │   │   └── register/
│   │   │       └── page.tsx    # Register page
│   │   ├── problems/
│   │   │   ├── page.tsx         # Problems list
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Problem detail
│   │   ├── contests/
│   │   │   ├── page.tsx         # Contests list
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Contest detail
│   │   │       ├── [prb]/
│   │   │       │   └── page.tsx # Contest problem
│   │   │       ├── rank/
│   │   │       │   └── page.tsx # Contest ranking
│   │   │       └── submissions/
│   │   │           └── page.tsx # Contest submissions
│   │   ├── submissions/
│   │   │   └── page.tsx         # Submissions list
│   │   ├── languages/
│   │   │   └── page.tsx         # Languages stats
│   │   ├── users/
│   │   │   └── [id]/
│   │   │       └── page.tsx    # User profile
│   │   ├── profile/
│   │   │   └── page.tsx         # Own profile
│   │   ├── admin/
│   │   │   ├── layout.tsx       # Admin layout
│   │   │   ├── page.tsx         # Admin dashboard
│   │   │   ├── users/
│   │   │   │   └── page.tsx    # Admin users
│   │   │   ├── languages/
│   │   │   │   └── page.tsx    # Admin languages
│   │   │   ├── topics/
│   │   │   │   └── page.tsx    # Admin topics
│   │   │   └── posts/
│   │   │       └── page.tsx    # Admin posts
│   │   ├── creator/
│   │   │   ├── layout.tsx       # Creator layout
│   │   │   ├── page.tsx         # Creator dashboard
│   │   │   ├── problems/
│   │   │   │   ├── page.tsx     # Creator problems
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx # Create problem
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Edit problem
│   │   │   ├── contests/
│   │   │   │   ├── page.tsx     # Creator contests
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx # Create contest
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Manage contest
│   │   │   └── posts/
│   │   │       ├── page.tsx     # Creator posts
│   │   │       └── [id]/
│   │   │           └── page.tsx # Edit post
│   │   └── components/
│   │       ├── Navbar.tsx       # Navigation bar
│   │       ├── AuthBar.tsx      # Auth buttons
│   │       ├── SubmitModal.tsx  # Submit code modal
│   │       ├── StatusBadge.tsx  # Status badge
│   │       ├── DifficultyBadge.tsx # Difficulty badge
│   │       ├── CommentsSection.tsx # Comments section
│   │       ├── SearchBar.tsx    # Search component
│   │       └── ContributionGraph.tsx # Stats graph
│   ├── src/
│   │   ├── lib/
│   │   │   └── firebase.ts     # Firebase config
│   │   └── scripts/
│   │       ├── icon.ts          # Icon utilities
│   │       └── memory.ts        # Memory formatting
│   ├── public/
│   │   ├── logo.ico
│   │   ├── logo.png
│   │   └── logot.png
│   ├── package.json             # Node.js dependencies
│   ├── next.config.js           # Next.js config
│   ├── tailwind.config.ts       # Tailwind CSS config
│   └── tsconfig.json            # TypeScript config
│
├── MySQL/
│   └── data.sql                 # SQL dump (nếu có)
│
├── logs/                        # Log files
│
└── README.md                    # File này
```

---

## 📝 Database Schema

Database sử dụng **MySQL** với các bảng chính:

### Core Tables

- **`TaiKhoan`**: Users/Accounts
  - `IdTaiKhoan`, `TenDangNhap`, `MatKhau` (hashed), `HoTen`, `Email`, `FirebaseUid`, `IsVerified`, `TrangThai`, `IdVaiTro`, `NgayTao`

- **`VaiTro`**: Roles
  - `IdVaiTro`, `TenVaiTro` (Admin, User, Creator)

- **`DeBai`**: Problems
  - `IdDeBai`, `IdTaiKhoan`, `TieuDe`, `NoiDungDeBai`, `DoKho`, `GioiHanThoiGian`, `GioiHanBoNho`, `DangCongKhai`, `TrangThai`, `NgayTao`

- **`CuocThi`**: Contests
  - `IdCuocThi`, `IdTaiKhoan`, `TenCuocThi`, `MoTa`, `ThoiGianBatDau`, `ThoiGianKetThuc`, `TrangThai`, `ChuY`, `NgayTao`

- **`BaiNop`**: Submissions
  - `IdBaiNop`, `IdTaiKhoan`, `IdDeBai`, `IdNgonNgu`, `IdCuocThi`, `DuongDanCode`, `TrangThaiCham` (JSON), `ThoiGianThucThi`, `BoNhoSuDung`, `NgayNop`

- **`NgonNgu`**: Programming Languages
  - `IdNgonNgu`, `TenNgonNgu`, `TenNhanDien`, `TrangThai`

- **`ChuDe`**: Topics/Tags
  - `IdChuDe`, `TenChuDe`, `MoTa`

- **`BinhLuan`**: Comments
  - `IdBinhLuan`, `IdDeBai`, `IdTaiKhoan`, `IdBinhLuanCha`, `NoiDung`, `TrangThai`, `NgayTao`

- **`BaiDang`**: Posts
  - `IdBaiDang`, `IdTaiKhoan`, `TieuDe`, `NoiDung`, `UuTien`, `TrangThai`, `NgayTao`, `NgayCapNhat`

### Junction Tables

- **`CuocThi_DeBai`**: Contest-Problem relationship
- **`CuocThi_DangKy`**: Contest registration
- **`DeBai_ChuDe`**: Problem-Topic relationship
- **`BoTest`**: Test cases (linked to DeBai)

Xem chi tiết trong `Server/prisma/schema.prisma`

---

## 🛠️ Development Guide

### Build Rust Services

```bash
# S3
cd S3
cargo build --release
# Binary: target/release/S3

# Kra
cd Kra
cargo build --release
# Binary: target/release/Kra

# Ark
cd Ark
cargo build --release
# Binary: target/release/Ark
```

### Run Tests

```bash
# Server tests (nếu có)
cd Server
npm test

# Rust tests
cd S3
cargo test

cd ../Kra
cargo test

cd ../Ark
cargo test
```

### Database Migrations

```bash
cd Server

# Tạo migration mới
npx prisma migrate dev --name <migration_name>

# Reset database (xóa tất cả data)
npx prisma migrate reset

# Xem database (GUI)
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Development Mode

```bash
# Server (với nodemon - auto reload)
cd Server
npm run dev

# Client (với Next.js hot reload)
cd Client
npm run dev
```

### Code Formatting

```bash
# Rust
cd S3
cargo fmt

# TypeScript/JavaScript
cd Server
npm run format  # (nếu có script)

cd Client
npm run format  # (nếu có script)
```

---

## 🔧 Cấu hình nâng cao

### S3 Service

- **Console Output**: `ENABLE_CONSOLE_OUTPUT=false` để tắt stats table
- **Max Calls**: `MAXCALL=100000000000000` - giới hạn trước khi reset stats
- **Port**: Mặc định `3001` (có thể thay đổi trong `main.rs`)

### Kra Worker

- **Redis URL**: `REDIS_URL=redis://127.0.0.1:6379`
- **Queue Name**: `REDIS_QUEUE=job_queue`
- **S3 Base URL**: `S3_BASE_URL=http://127.0.0.1:3001`
- **Web Port**: `KRA_WEB_PORT=4000`
- **Worker Secret**: `WORKER_SECRET=...` (cho callback auth)

### Server

- **Port**: `PORT=5000` (mặc định)
- **CORS**: Cấu hình trong `main.ts`
- **JWT Expiry**: 7 days (có thể thay đổi trong `auth.ts`)
- **Rate Limiting**: Có thể thêm middleware (ví dụ: `express-rate-limit`)

### Client

- **API Base URL**: `NEXT_PUBLIC_API_BASE=http://localhost:5000`
- **Port**: Next.js tự động chọn port trống (mặc định 3000)
- **Build**: `npm run build` → `npm start` (production)

### Ark Service

- **OpenAI API Key**: `OPENAI_API_KEY=...`
- **Batch Size**: 16 comments per request
- **Scan Interval**: 24 hours
- **Database**: Cùng database với Server

---

## 🐛 Troubleshooting

### Lỗi kết nối Database

**Triệu chứng**: `PrismaClientInitializationError` hoặc `ECONNREFUSED`

**Giải pháp**:
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p
# Hoặc
sudo systemctl status mysql

# Kiểm tra DATABASE_URL trong Server/.env
# Format: mysql://user:password@localhost:3306/database_name

# Test connection
cd Server
npx prisma db pull  # Test connection
```

### Lỗi Redis

**Triệu chứng**: `Connection refused` hoặc `BLPOP timeout`

**Giải pháp**:
```bash
# Kiểm tra Redis đang chạy
redis-cli ping
# Nên trả về: PONG

# Kiểm tra REDIS_URL trong Server/.env và Kra/.env
# Format: redis://127.0.0.1:6379

# Test connection
redis-cli
> PING
PONG
```

### Port đã được sử dụng

**Triệu chứng**: `Address already in use` hoặc `EADDRINUSE`

**Giải pháp**:

**Windows**:
```bash
# Tìm process đang dùng port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <pid> /F
```

**Linux/Mac**:
```bash
# Tìm process
lsof -ti:3000
# Kill process
lsof -ti:3000 | xargs kill
# Hoặc
sudo kill -9 $(lsof -ti:3000)
```

### Cargo build errors

**Triệu chứng**: Compilation errors hoặc dependency issues

**Giải pháp**:
```bash
# Update Rust
rustup update

# Clean build
cargo clean
cargo build --release

# Update dependencies
cargo update
```

### Prisma errors

**Triệu chứng**: `PrismaClientKnownRequestError` hoặc schema mismatch

**Giải pháp**:
```bash
cd Server

# Regenerate Prisma Client
npx prisma generate

# Reset và migrate lại
npx prisma migrate reset
npx prisma migrate dev

# Kiểm tra schema
npx prisma validate
```

### Kra Worker không nhận job

**Triệu chứng**: Job trong Redis nhưng Kra không xử lý

**Giải pháp**:
1. Kiểm tra Redis connection trong Kra logs
2. Kiểm tra `REDIS_QUEUE` name (phải giống với Server)
3. Kiểm tra job format (phải có `task: "judge"`)
4. Xem logs: `cargo run` trong Kra directory

### S3 upload/download errors

**Triệu chứng**: `404 Not Found` hoặc `Invalid filename`

**Giải pháp**:
1. Kiểm tra file tồn tại trong `S3/data/code/` hoặc `S3/data/test/`
2. Validate filename (chỉ alphanumeric, `_`, `-`)
3. Kiểm tra S3 service đang chạy: `curl http://127.0.0.1:3001/`

### Client không kết nối được API

**Triệu chứng**: `Network Error` hoặc `CORS error`

**Giải pháp**:
1. Kiểm tra `NEXT_PUBLIC_API_BASE` trong `Client/.env.local`
2. Kiểm tra Server đang chạy: `curl http://localhost:5000/api/health`
3. Kiểm tra CORS config trong `Server/src/main.ts`

### Submission không được chấm

**Triệu chứng**: Submission mãi ở trạng thái "Đang chấm..."

**Giải pháp**:
1. Kiểm tra Kra worker đang chạy
2. Kiểm tra Redis queue có job không: `redis-cli LRANGE job_queue 0 -1`
3. Kiểm tra S3 có file code và test không
4. Xem logs của Kra worker
5. Kiểm tra callback URL và worker secret

---

## 📚 Tài liệu tham khảo

- [Rust Documentation](https://doc.rust-lang.org/)
- [Axum Documentation](https://docs.rs/axum/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Documentation](https://redis.io/docs/)
- [Isolate Documentation](https://github.com/ioi/isolate)

---

## 📞 Liên hệ

Hãy gửi [Email](dangvanthong29042003@gmail.com) cho tôi nhé.

---

**Made with ❤️ by Kra-tognoek Team**
