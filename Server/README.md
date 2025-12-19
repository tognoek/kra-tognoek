# Server API (Node.js/Express + Prisma)

Backend REST API quản lý users, problems, contests, submissions; đẩy job vào Redis cho Kra worker.

## Yêu cầu
- Node.js 18+
- MySQL 8+
- Redis 6+

## Cấu hình
```
cp env.example .env
# Chỉnh lại:
DATABASE_URL="mysql://user:password@localhost:3306/oj_system"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="your-secret-key-change-in-production"
```

## Cài đặt & migrate
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Tạo admin user và dữ liệu mẫu
```

## Chạy dev
```bash
npm run dev
```

Mặc định: `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại (cần auth)

### Problems
- `GET /api/problems` - Lấy danh sách problems
- `POST /api/problems` - Tạo problem mới (cần auth)
- `GET /api/problems/:id` - Lấy chi tiết problem

### Contests
- `GET /api/contests` - Lấy danh sách contests
- `POST /api/contests` - Tạo contest mới (cần auth)
- `POST /api/contests/:id/register` - Đăng ký contest (cần auth)

### Submissions
- `GET /api/submissions` - Lấy danh sách submissions (query: status, problemId, userId, contestId)
- `POST /api/submissions` - Nộp bài mới (cần auth)
- `GET /api/submissions/:id` - Lấy chi tiết submission
- `POST /api/submissions/:id/callback` - Callback từ Kra worker (internal)

### Admin (cần quyền Admin)
- `GET /api/admin/stats` - Thống kê tổng quan
- `GET /api/admin/users` - Lấy danh sách users
- `PUT /api/admin/users/:id` - Cập nhật user
- `DELETE /api/admin/users/:id` - Vô hiệu hóa user
- `GET /api/admin/problems` - Lấy danh sách problems (admin view)
- `PUT /api/admin/problems/:id` - Cập nhật problem
- `GET /api/admin/contests` - Lấy danh sách contests (admin view)

### Khác
- `GET /api/users` - Lấy danh sách users
- `GET /api/languages` - Lấy danh sách ngôn ngữ hỗ trợ
- `GET /api/topics` - Lấy danh sách topics/chủ đề
- `GET /api/comments` - Lấy comments
- `POST /api/comments` - Tạo comment (cần auth)

## Authentication

API sử dụng JWT token. Sau khi login/register, client nhận được token và gửi kèm trong header:

```
Authorization: Bearer <token>
```

## Admin Account

Sau khi chạy `npm run seed`, tài khoản admin mặc định:
- Username: `admin`
- Password: `admin123`

**⚠️ Đổi mật khẩu ngay sau khi deploy!**

## Luồng nộp bài
1) FE gọi `POST /api/submissions`
2) Server lưu submission vào MySQL, push job lên Redis
3) Kra worker chấm, rồi gọi `/api/submissions/:id/callback`
4) Server cập nhật kết quả, FE hiển thị

## Ghi chú
- Prisma schema: `prisma/schema.prisma`
- Redis queue init: `src/redis/main.ts`
- Express router: `src/routes/index.ts`
- Auth middleware: `src/middleware/auth.ts`
