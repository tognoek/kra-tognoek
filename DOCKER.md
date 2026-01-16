# Docker Setup Guide

Hướng dẫn sử dụng Docker để chạy toàn bộ hệ thống Kra-tognoek.

## 📋 Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+
- Ít nhất 4GB RAM
- Ít nhất 10GB dung lượng đĩa

## 🚀 Quick Start

### 1. Cấu hình Environment Variables

Copy file `.env.example` thành `.env`:

```bash
cp env.example .env
```

Chỉnh sửa `.env` với các giá trị phù hợp:

```env
# MySQL
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=oj_system
MYSQL_USER=oj_user
MYSQL_PASSWORD=your_password

# JWT & Worker Secrets
JWT_SECRET=your-jwt-secret-min-32-chars
WORKER_SECRET=your-worker-secret-min-32-chars

# OpenAI (cho Ark service)
OPENAI_API_KEY=sk-...

# Resend (cho email)
RESEND_API_KEY=re_...
```

### 2. Build và Start Services

```bash
# Build tất cả images
docker-compose build

# Start tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f server
docker-compose logs -f kra
```

### 3. Setup Database

MySQL sẽ tự động chạy các file SQL trong thư mục `MySQL/` khi khởi tạo database lần đầu:
- `data.sql` - Dữ liệu mẫu/seed data

**Lưu ý**: Các file SQL chỉ chạy khi volume `mysql_data` chưa tồn tại (database mới). Nếu muốn chạy lại, xóa volume:

```bash
docker-compose down -v  # Xóa volumes
docker-compose up -d    # Tạo lại và chạy SQL files
```

Sau khi MySQL đã sẵn sàng, chạy Prisma migrations:

```bash
# Vào container Server
docker-compose exec server sh

# Trong container
npx prisma generate
npx prisma migrate deploy

# Hoặc seed data (nếu có)
npm run seed
```

### 4. Truy cập Services

- **Client**: http://localhost:3000
- **Server API**: http://localhost:5000/api
- **S3**: http://localhost:3001
- **Kra Web UI**: http://localhost:4000
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 🛠️ Commands

### Quản lý Services

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Start service
docker-compose start

# Stop và remove containers
docker-compose down

# Stop, remove containers và volumes
docker-compose down -v

# Restart service cụ thể
docker-compose restart server

# Rebuild service cụ thể
docker-compose build --no-cache server
docker-compose up -d server
```

### Xem Logs

```bash
# Tất cả logs
docker-compose logs -f

# Service cụ thể
docker-compose logs -f server
docker-compose logs -f kra
docker-compose logs -f s3
docker-compose logs -f mysql
docker-compose logs -f redis
```

### Database Operations

```bash
# Vào MySQL container
docker-compose exec mysql mysql -u root -p

# Backup database
docker-compose exec mysql mysqldump -u root -p oj_system > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p oj_system < backup.sql

# Vào Server container để chạy Prisma
docker-compose exec server sh
npx prisma studio  # GUI để xem DB
```

### Debugging

```bash
# Vào container để debug
docker-compose exec server sh
docker-compose exec kra sh
docker-compose exec s3 sh

# Kiểm tra network
docker network inspect kra-tognoek_kra-network

# Kiểm tra volumes
docker volume ls
docker volume inspect kra-tognoek_s3_data
```

## 🔧 Cấu hình nâng cao

### Custom Ports

Tạo file `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  mysql:
    ports:
      - "3307:3306"  # Thay đổi port MySQL
  redis:
    ports:
      - "6380:6379"  # Thay đổi port Redis
  server:
    ports:
      - "5001:5000"  # Thay đổi port Server
  client:
    ports:
      - "3001:3000"  # Thay đổi port Client
```

### Resource Limits

Thêm vào `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Volume Mounts

Để mount local directories:

```yaml
services:
  s3:
    volumes:
      - ./S3/data:/app/data  # Mount local data
  server:
    volumes:
      - ./Server/prisma:/app/prisma  # Mount Prisma schema
```

## 🐛 Troubleshooting

### Services không start

```bash
# Kiểm tra logs
docker-compose logs

# Kiểm tra health status
docker-compose ps

# Restart tất cả
docker-compose restart
```

### Database connection errors

```bash
# Kiểm tra MySQL đang chạy
docker-compose ps mysql

# Kiểm tra connection từ Server
docker-compose exec server sh
npx prisma db pull
```

### Redis connection errors

```bash
# Kiểm tra Redis
docker-compose exec redis redis-cli ping

# Test từ Kra container
docker-compose exec kra sh
# Trong container: ping redis
```

### Port conflicts

```bash
# Kiểm tra port đang dùng
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Thay đổi port trong docker-compose.yml
```

### Build errors

```bash
# Clean build
docker-compose build --no-cache

# Rebuild service cụ thể
docker-compose build --no-cache server
```

### Permission errors (Linux)

```bash
# Fix permissions cho volumes
sudo chown -R $USER:$USER ./S3/data
sudo chown -R $USER:$USER ./Server/data
```

## 📊 Monitoring

### Health Checks

Tất cả services đều có health checks:

```bash
# Kiểm tra health
docker-compose ps

# Health check cụ thể
docker inspect --format='{{.State.Health.Status}}' kra-tognoek-server
```

### Resource Usage

```bash
# Xem resource usage
docker stats

# Xem resource của service cụ thể
docker stats kra-tognoek-server
```

## 🔐 Security

### Production Setup

1. **Đổi tất cả passwords** trong `.env`
2. **Sử dụng secrets** thay vì environment variables
3. **Không expose ports** không cần thiết
4. **Sử dụng reverse proxy** (nginx/traefik)
5. **Enable SSL/TLS**

### Secrets Management

```bash
# Tạo secrets
echo "your-secret" | docker secret create jwt_secret -
echo "your-secret" | docker secret create worker_secret -

# Sử dụng trong docker-compose.yml
services:
  server:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

## 📝 Notes

- **Data persistence**: Tất cả data được lưu trong Docker volumes
- **Network**: Tất cả services giao tiếp qua network `kra-network`
- **Environment**: Variables được load từ `.env` file
- **Health checks**: Services tự động restart nếu unhealthy
- **Logs**: Logs được lưu trong Docker và có thể xem bằng `docker-compose logs`

## 🚀 Production Deployment

1. **Build production images**:
   ```bash
   docker-compose -f docker-compose.yml build
   ```

2. **Tag và push images** (nếu dùng registry):
   ```bash
   docker tag kra-tognoek-server:latest registry.example.com/kra-tognoek-server:latest
   docker push registry.example.com/kra-tognoek-server:latest
   ```

3. **Deploy với production config**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. **Setup reverse proxy** (nginx/traefik) để expose services

5. **Enable monitoring** (Prometheus, Grafana)

6. **Setup backups** cho MySQL và volumes

