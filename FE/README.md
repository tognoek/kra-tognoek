# Frontend - Online Judge System

Frontend web application cho hệ thống Online Judge, được xây dựng với HTML/CSS/JavaScript thuần.

## Cấu trúc

```
FE/
├── public/
│   ├── index.html          # Trang chủ
│   ├── login.html          # Đăng nhập
│   ├── register.html       # Đăng ký
│   ├── problems.html       # Danh sách đề bài
│   ├── contests.html       # Danh sách cuộc thi
│   ├── submissions.html    # Danh sách bài nộp
│   ├── admin.html          # Trang admin dashboard
│   ├── css/
│   │   └── style.css       # Stylesheet chính
│   └── js/
│       ├── auth.js         # Authentication utilities
│       └── api.js          # API helper functions
```

## Tính năng

- ✅ Đăng nhập / Đăng ký
- ✅ Xem danh sách đề bài
- ✅ Xem danh sách cuộc thi
- ✅ Xem bài nộp
- ✅ Admin dashboard (quản lý users, problems, contests)
- ✅ Responsive design
- ✅ UI đẹp với gradient và animations

## Cách chạy

### Option 1: Chạy riêng với http-server (khuyến nghị)

```bash
cd FE
npm install -g http-server  # Nếu chưa cài
npm run dev:static
```

Hoặc:

```bash
cd FE/public
npx http-server -p 3000 -c-1
```

Frontend sẽ chạy tại: `http://localhost:3000`

### Option 2: Chạy với Next.js (nếu có app Next.js)

```bash
cd FE
npm install
npm run dev
```

## Ports

- **Frontend**: `http://localhost:3000`
- **Server API**: `http://localhost:5000/api`
- **S3**: `http://127.0.0.1:3001`
- **Kra Web UI**: `http://127.0.0.1:4000`

## API Endpoints sử dụng

Frontend gọi API tại `http://localhost:5000/api`:

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `GET /api/problems` - Lấy danh sách đề bài
- `GET /api/contests` - Lấy danh sách cuộc thi
- `GET /api/submissions` - Lấy danh sách bài nộp
- `GET /api/admin/*` - Các API admin (cần quyền Admin)

## Authentication

Frontend sử dụng JWT token được lưu trong `localStorage`:

```javascript
localStorage.setItem('token', token); // Sau khi login
localStorage.removeItem('token');     // Khi logout
```

Token được tự động gửi kèm trong header `Authorization: Bearer <token>` cho mọi request API.
