## Kra-tognoek – Online Judge System

Hệ thống chấm bài tự động (Online Judge) với kiến trúc microservices, hỗ trợ nộp bài, chấm tự động, tổ chức cuộc thi, blog / bài đăng và hệ thống thống kê phong phú.

### 🏗️ Kiến trúc tổng quan

Trong repo có 4 services chính:

- **S3** (`S3/`, Rust + Axum): dịch vụ lưu trữ file – upload / download code và bộ test, gắn kèm thống kê tài nguyên.
- **Kra** (`Kra/`, Rust + Tokio + Axum): worker chấm bài + web UI:
  - Worker: nghe job từ Redis, tải bundle test từ S3, compile & chạy test, gửi callback về Server.
  - Web UI (`Kra/ui/index.html`): form tạo job thủ công để test KRA.
- **Ark** (`Ark/`, Rust): service hỗ trợ/tiện ích (ví dụ: kiểm duyệt nội dung comment bằng OpenAI – xem `Ark/src/main.rs`). 
- **Server** (`Server/`, Node.js + Express + Prisma + Redis): REST API backend quản lý Users, Problems, Contests, Submissions, Comments, Posts, Languages,...
- **Client** (`Client/`, Next.js App Router + React): giao diện web cho thí sinh, admin, contest creator.

Luồng chính: **Client → Server → Redis → Kra → S3 → Kra → Server → Client**.

## 📋 Yêu cầu hệ thống

### Phần mềm cần thiết:
- **Rust** (1.70+): Để build S3 và Kra services
- **Node.js** (18+): Để chạy Server và FE
- **MySQL** (8.0+): Database chính
- **Redis** (6.0+): Job queue cho Kra worker

### Reset Prisma
```shell
npx prisma generate
```

### Cài đặt dependencies:

#### Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Node.js:
Tải từ [nodejs.org](https://nodejs.org/) hoặc dùng nvm:
```bash
nvm install 18
nvm use 18
```

#### MySQL:
- Windows: [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- Linux: `sudo apt-get install mysql-server`
- Mac: `brew install mysql`

#### Redis:
- Windows: [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- Linux: `sudo apt-get install redis-server`
- Mac: `brew install redis`

## 🚀 Cài đặt và Chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd DoAn
```

### 2. Cấu hình Database

Chạy Redis server:
```shell
sudo systemctl start redis-server
```
Chạy MySQL
```shell
sudo systemctl status mysql
sudo systemctl start apache2
mysqldump -u [username] -p [database_name] > backup_file.sql
```
Open web [UI MySQL](http://localhost/phpmyadmin/)
### 3. Cấu hình Environment Variables

#### S3 Service (`S3/.env`):
```bash
cp S3/env.example S3/.env
```
Chỉnh sửa nếu cần:
- `ENABLE_CONSOLE_OUTPUT=true` - Bật/tắt console output
- `MAXCALL=100000000000000` - Giới hạn số lần gọi

#### Server (`Server/.env`):
```bash
cp Server/env.example Server/.env
```
Chỉnh sửa:
```env
DATABASE_URL="mysql://user:password@localhost:3306/oj_system"
REDIS_URL="redis://127.0.0.1:6379"
```

### 4. Setup Database Schemaw

```bash
cd Server
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Install Dependencies

#### Frontend:
```bash
cd FE
npm install
```

#### Server (đã install ở bước 4):
```bash
cd Server
npm install
```

#### Rust Services (tự động khi build):
```bash
cd S3
cargo build --release

cd ../Kra
cargo build --release
```

### 6. Chạy tất cả services

#### Linux/Mac:
```bash
./run-all.sh
```

#### Windows:
```bash
run-all.bat
```

Hoặc chạy từng service riêng:

```bash
# Terminal 1 - S3 Service
cd S3
cargo run

# Terminal 2 - Kra Worker
cd Kra
cargo run

# Terminal 3 - Server API
cd Server
npm run dev

# Terminal 4 - Frontend
cd FE/public
npx http-server -p 3000 -c-1
```

## 🌐 Ports và URLs

Sau khi chạy, các services sẽ chạy trên:

- **Frontend**: `http://localhost:3000` (web UI)
- **Server API**: `http://localhost:5000/api` (REST API)
- **S3**: `http://127.0.0.1:3001` (file storage)
- **Kra Web UI**: `http://127.0.0.1:4000` (test UI cho Kra worker)
- **Kra Worker**: Chạy background, không có HTTP server

## 📡 API Endpoints

### S3 Service

- `GET /download` - Download zip file từ test directory
- `POST /upload/code` - Upload file .cpp vào code directory
- `POST /upload/test` - Upload file .zip vào test directory
- `GET /` hoặc `GET /upload.html` - Trang upload HTML

### Server API

Base URL: `http://localhost:5000/api`

#### Problems
- `GET /problems` - Lấy danh sách problems
- `POST /problems` - Tạo problem mới
- `GET /problems/:id` - Lấy chi tiết problem

#### Contests
- `GET /contests` - Lấy danh sách contests
- `POST /contests` - Tạo contest mới
- `POST /contests/:id/register` - Đăng ký contest

#### Submissions
- `GET /submissions` - Lấy danh sách submissions (có query params: status, problemId, userId, contestId)
- `POST /submissions` - Nộp bài mới
- `GET /submissions/:id` - Lấy chi tiết submission
- `POST /submissions/:id/callback` - Callback từ Kra worker (internal)

#### Users
- `GET /users` - Lấy danh sách users
- `POST /users` - Tạo user mới

#### Languages
- `GET /languages` - Lấy danh sách ngôn ngữ hỗ trợ

#### Topics
- `GET /topics` - Lấy danh sách topics/chủ đề

#### Comments
- `GET /comments` - Lấy comments
- `POST /comments` - Tạo comment

## 📁 Cấu trúc thư mục

```
Kra-tognoek/
├── S3/                    # File storage service (Rust)
│   ├── src/
│   │   ├── main.rs        # Axum server, upload/download endpoints
│   │   ├── stats.rs       # Statistics tracking
│   │   ├── pool.rs        # Stats pool management
│   │   └── monitor.rs     # Resource monitoring
│   ├── data/
│   │   ├── code/          # Lưu trữ file .cpp
│   │   └── test/           # Lưu trữ file .zip test cases
│   └── Cargo.toml
│
├── Kra/                    # Worker service (Rust)
│   ├── src/
│   │   ├── main.rs        # Redis consumer, job processing
│   │   └── tog/           # Test execution module
│   │       ├── mod.rs     # Orchestrator
│   │       ├── fetch.rs   # Fetch files from S3
│   │       ├── run.rs     # Compile & run code
│   │       └── types.rs   # Type definitions
│   └── Cargo.toml
│
├── Server/                 # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── main.ts        # Express server setup
│   │   ├── db.ts          # Prisma client
│   │   ├── redis/         # Redis job queue
│   │   └── routes/        # API routes
│   │       ├── problems.ts
│   │       ├── contests.ts
│   │       ├── submissions.ts
│   │       └── ...
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
├── FE/                     # Frontend (Next.js)
│   ├── app/
│   │   ├── layout.tsx     # Root layout với navigation
│   │   ├── page.tsx       # Home page
│   │   ├── problems/      # Problems pages
│   │   ├── contests/      # Contests pages
│   │   ├── submissions/   # Submissions pages
│   │   ├── languages/    # Languages page
│   │   └── components/    # Reusable components
│   └── package.json
│
├── run-all.sh             # Script chạy tất cả services (Linux/Mac)
├── run-all.bat            # Script chạy tất cả services (Windows)
└── README.md              # File này
```

## 🔄 Luồng hoạt động

1. **User nộp bài** qua Frontend → Server API
2. **Server** tạo submission record trong DB và push job vào Redis queue
3. **Kra worker** nhận job từ Redis:
   - Fetch code file (.cpp) từ S3
   - Fetch test cases (.zip) từ S3
   - Compile code
   - Chạy test cases với checker
   - Gửi kết quả về Server qua callback API
4. **Server** cập nhật submission status trong DB
5. **Frontend** hiển thị kết quả (auto-refresh mỗi 5 giây)

## 🛠️ Development

### Build Rust services:
```bash
cd S3
cargo build --release

cd ../Kra
cargo build --release
```

### Run tests:
```bash
# Server tests (nếu có)
cd Server
npm test

# Rust tests
cd S3
cargo test

cd ../Kra
cargo test
```

### Database migrations:
```bash
cd Server
npx prisma migrate dev --name <migration_name>
npx prisma studio  # GUI để xem DB
```

## 📝 Database Schema

Database sử dụng MySQL với các bảng chính:

- **TaiKhoan**: Users/Accounts
- **VaiTro**: Roles
- **DeBai**: Problems
- **CuocThi**: Contests
- **BaiNop**: Submissions
- **NgonNgu**: Programming Languages
- **ChuDe**: Topics/Tags
- **BinhLuan**: Comments

Xem chi tiết trong `Server/prisma/schema.prisma`

## 🔧 Cấu hình nâng cao

### S3 Service
- Console output có thể tắt bằng `ENABLE_CONSOLE_OUTPUT=false`
- Port mặc định: 3000 (có thể thay đổi trong code)

### Kra Worker
- Redis connection: `redis://127.0.0.1:6379`
- Timeout cho mỗi test case: configurable trong code
- Memory limit: configurable trong code

### Server
- Port mặc định: 3000 (hoặc từ env)
- CORS: Cấu hình trong `main.ts`
- Rate limiting: Có thể thêm middleware

### Frontend
- API base URL: `NEXT_PUBLIC_API_BASE` (mặc định: `http://localhost:3000`)
- Port: Next.js tự động chọn port trống

## 🐛 Troubleshooting

### Lỗi kết nối Database:
- Kiểm tra MySQL đang chạy: `mysql -u root -p`
- Kiểm tra `DATABASE_URL` trong `Server/.env`
- Chạy migrations: `cd Server && npx prisma migrate dev`

### Lỗi Redis:
- Kiểm tra Redis đang chạy: `redis-cli ping`
- Kiểm tra `REDIS_URL` trong `Server/.env`

### Port đã được sử dụng:
- Thay đổi port trong code hoặc kill process đang dùng port đó
- Windows: `netstat -ano | findstr :3000` → `taskkill /PID <pid> /F`
- Linux/Mac: `lsof -ti:3000 | xargs kill`

### Cargo build errors:
- Update Rust: `rustup update`
- Clean build: `cargo clean && cargo build`
