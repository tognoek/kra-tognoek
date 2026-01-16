# MySQL Initialization Files

Thư mục này chứa các file SQL sẽ được **tự động chạy** khi MySQL container được khởi tạo lần đầu.

## 📋 Files

### `code.sql`
- Tạo database schema (tables, indexes, constraints)
- Chạy **trước** `data.sql` (theo thứ tự alphabet)

### `data.sql`
- Chứa dữ liệu mẫu/seed data
- Chạy **sau** `code.sql` (theo thứ tự alphabet)

## ⚙️ Cách hoạt động

1. Khi MySQL container được tạo lần đầu, nó sẽ:
   - Tự động chạy tất cả file `.sql`, `.sh`, `.sql.gz` trong `/docker-entrypoint-initdb.d`
   - Chạy theo thứ tự alphabet (a-z, 0-9)
   - Chỉ chạy **một lần** khi database chưa tồn tại

2. Các file được mount từ `./MySQL` vào `/docker-entrypoint-initdb.d` trong container

## 🔄 Chạy lại SQL files

Nếu muốn chạy lại SQL files (ví dụ sau khi cập nhật data.sql):

```bash
# ⚠️ CẢNH BÁO: Lệnh này sẽ XÓA TẤT CẢ DATA trong database!
docker-compose down -v  # Xóa volumes (bao gồm mysql_data)
docker-compose up -d    # Tạo lại và chạy SQL files
```

## 📝 Lưu ý

- **Database name**: Các file SQL tạo database `kra-tognoek`
- **MYSQL_DATABASE**: Trong docker-compose.yml có thể set `oj_system`, nhưng SQL files sẽ tạo `kra-tognoek`
- **Thứ tự**: `code.sql` chạy trước `data.sql` (theo alphabet)
- **Một lần**: SQL files chỉ chạy khi volume `mysql_data` chưa tồn tại

## 🐛 Troubleshooting

### SQL files không chạy

**Triệu chứng**: Database không có data sau khi start container

**Nguyên nhân**: Volume `mysql_data` đã tồn tại từ lần chạy trước

**Giải pháp**:
```bash
# Xóa volume và tạo lại
docker-compose down -v
docker-compose up -d
```

### Lỗi syntax trong SQL

**Triệu chứng**: MySQL container không start hoặc có lỗi trong logs

**Giải pháp**:
```bash
# Xem logs MySQL
docker-compose logs mysql

# Kiểm tra syntax SQL file
mysql -u root -p < MySQL/data.sql
```

### Database name không khớp

**Triệu chứng**: Server không kết nối được database

**Nguyên nhân**: SQL files tạo `kra-tognoek` nhưng DATABASE_URL dùng `oj_system`

**Giải pháp**:
1. Cập nhật `MYSQL_DATABASE` trong `.env` thành `kra-tognoek`
2. Hoặc cập nhật SQL files để dùng database name từ environment variable

