# Frontend (Next.js 16 + React 18)

Giao diện người dùng cho hệ thống Online Judge.

## Yêu cầu
- Node.js 18+

## Cấu hình
- Biến môi trường: `NEXT_PUBLIC_API_BASE` (mặc định `http://localhost:3000`)

## Cài đặt
```bash
npm install
```

## Chạy dev
```bash
npm run dev
```

## Trang chính
- `/` Home
- `/problems` Danh sách problems (search/filter, link chi tiết)
- `/problems/[id]` Trang chi tiết problem
- `/contests` Danh sách contests (search/filter status)
- `/submissions` Nộp bài + bảng submissions (auto refresh 5s, search/filter)
- `/languages` Danh sách ngôn ngữ

## Component dùng chung
- `StatusBadge`, `DifficultyBadge`, `SearchBar`

## Styles
- `app/globals.css` chứa layout + utility (card, table, form, pill, v.v.)

