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
```

## Cài đặt & migrate
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

## Chạy dev
```bash
npm run dev
```

Mặc định: `http://localhost:3000/api`

## API chính
- **Problems**: `GET /problems`, `POST /problems`, `GET /problems/:id`
- **Contests**: `GET /contests`, `POST /contests`, `POST /contests/:id/register`
- **Submissions**: `GET /submissions?status&problemId&userId&contestId`, `POST /submissions`, `GET /submissions/:id`, `POST /submissions/:id/callback`
- **Users**: `GET /users`, `POST /users`
- **Languages**: `GET /languages`
- **Topics**: `GET /topics`
- **Comments**: `GET /comments`, `POST /comments`

## Luồng nộp bài
1) FE gọi `POST /api/submissions`
2) Server lưu submission vào MySQL, push job lên Redis
3) Kra worker chấm, rồi gọi `/api/submissions/:id/callback`
4) Server cập nhật kết quả, FE hiển thị

## Ghi chú
- Prisma schema: `prisma/schema.prisma`
- Redis queue init: `src/redis/main.ts`
- Express router: `src/routes/index.ts`

