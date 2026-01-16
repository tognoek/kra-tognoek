# 🐳 Docker Setup - Quick Start

Hướng dẫn nhanh để chạy hệ thống Kra-tognoek bằng Docker.

## ⚠️ Lưu ý

**Kra Service chạy BÊN NGOÀI Docker** (vì cần isolate). Xem [KRA-OUTSIDE-DOCKER.md](./KRA-OUTSIDE-DOCKER.md) để setup Kra.

## ⚡ Quick Start

### 1. Cấu hình Environment

```bash
# Copy file env.example
cp env.example .env

# Chỉnh sửa .env với các giá trị của bạn
nano .env  # hoặc vim, code, etc.
```

**Quan trọng**: Đổi các secrets sau:
- `JWT_SECRET`: Secret key cho JWT (ít nhất 32 ký tự)
- `WORKER_SECRET`: Secret key cho Kra worker callback
- `MYSQL_ROOT_PASSWORD`: Password cho MySQL root
- `MYSQL_PASSWORD`: Password cho MySQL user

### 2. Start Services

**Linux/Mac:**
```bash
# Cách 1: Dùng script
./docker-start.sh

# Cách 2: Dùng Makefile
make build
make up

# Cách 3: Dùng docker-compose trực tiếp
docker-compose build
docker-compose up -d
```

**Windows:**
```bash
# Cách 1: Dùng script
docker-start.bat

# Cách 2: Dùng docker-compose trực tiếp
docker-compose build
docker-compose up -d
```

### 3. Setup Database

MySQL sẽ **tự động chạy** các file SQL trong thư mục `MySQL/` khi khởi tạo database lần đầu:
- `code.sql` - Database schema
- `data.sql` - Seed data

**Lưu ý**: SQL files chỉ chạy khi database được tạo lần đầu. Nếu muốn chạy lại:
```bash
docker-compose down -v  # Xóa volumes (mất data!)
docker-compose up -d    # Tạo lại và chạy SQL files
```

Sau khi services đã start, chạy Prisma migrations:

```bash
# Vào Server container
docker-compose exec server sh

# Trong container
npx prisma generate
npx prisma migrate deploy

# (Tùy chọn) Seed data
npm run seed
```

Hoặc dùng Makefile:
```bash
make db-migrate
make db-seed
```

### 4. Start Kra Service (Bên ngoài Docker)

```bash
# Xem hướng dẫn chi tiết
cat KRA-OUTSIDE-DOCKER.md

# Quick start
cd Kra
cp .env.docker.example .env
# Chỉnh sửa .env với WORKER_SECRET giống với .env ở root
cargo run --release
```

### 5. Truy cập Services

- 🌐 **Client**: http://localhost:3000
- 🔌 **Server API**: http://localhost:5000/api
- 📦 **S3**: http://localhost:3001
- ⚙️ **Kra Web UI**: http://localhost:4000 (khi Kra đang chạy)
- 🗄️ **MySQL**: localhost:3306
- 🔴 **Redis**: localhost:6379

## 📋 Commands

### Dùng Makefile (Linux/Mac)

```bash
make help          # Xem tất cả commands
make build         # Build images
make up            # Start services
make down          # Stop services
make logs          # Xem logs
make ps            # Xem status
make shell-server  # Vào Server container
make db-migrate    # Chạy migrations
make db-studio     # Mở Prisma Studio
```

### Dùng docker-compose

```bash
# Start
docker-compose up -d

# Stop
docker-compose stop

# Stop và remove
docker-compose down

# Xem logs
docker-compose logs -f

# Xem logs service cụ thể
docker-compose logs -f server
docker-compose logs -f kra

# Restart service
docker-compose restart server

# Rebuild service
docker-compose build --no-cache server
docker-compose up -d server
```

## 🔍 Troubleshooting

### Services không start

```bash
# Xem logs
docker-compose logs

# Kiểm tra status
docker-compose ps

# Restart
docker-compose restart
```

### Database connection errors

```bash
# Kiểm tra MySQL
docker-compose exec mysql mysql -u root -p

# Test connection từ Server
docker-compose exec server sh
npx prisma db pull
```

### Port conflicts

Nếu port đã được sử dụng, thay đổi trong `docker-compose.yml`:

```yaml
services:
  server:
    ports:
      - "5001:5000"  # Thay đổi port
```

### Rebuild từ đầu

```bash
# Stop và xóa tất cả
docker-compose down -v

# Rebuild
docker-compose build --no-cache

# Start lại
docker-compose up -d
```

## 📚 Xem thêm

Chi tiết đầy đủ: [DOCKER.md](./DOCKER.md)

