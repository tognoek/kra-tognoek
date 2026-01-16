# 🚀 Chạy Kra Service Bên Ngoài Docker

Vì Kra service cần sử dụng **isolate** (sandbox environment), nên chúng ta sẽ chạy Kra **bên ngoài Docker** nhưng vẫn kết nối được với các services khác trong Docker.

## 📋 Yêu cầu

### 1. Cài đặt Isolate

```bash
sudo apt update
sudo apt install -y build-essential libcap-dev git
git clone https://github.com/ioi/isolate.git
cd isolate
make
sudo make install

# Kiểm tra
which isolate
# => /usr/local/bin/isolate

# Cấp quyền
sudo chown root:root /usr/local/bin/isolate
sudo chmod u+s /usr/local/bin/isolate
```

### 2. Cài đặt Rust và Dependencies

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update

# Compilers (g++ và gcc)
sudo apt install -y g++ gcc libc6-dev
```

### 3. Build Kra Service

```bash
cd Kra
cargo build --release
# Binary: target/release/Kra
```

## ⚙️ Cấu hình

### 1. Copy Environment File

```bash
cd Kra
cp .env.docker.example .env
```

### 2. Chỉnh sửa `.env`

```env
# Redis - Kết nối với Redis trong Docker (localhost:6379)
REDIS_URL=redis://localhost:6379
REDIS_QUEUE=job_queue

# S3 Service - Kết nối với S3 trong Docker (localhost:3001)
S3_BASE_URL=http://localhost:3001

# Kra Web UI Port
KRA_WEB_PORT=4000

# Worker Secret - PHẢI GIỐNG với WORKER_SECRET trong Server/.env
WORKER_SECRET=worker-secret-key-change-in-production
```

**Quan trọng**: `WORKER_SECRET` phải **giống hệt** với `WORKER_SECRET` trong file `.env` ở thư mục gốc (dùng cho Docker).

### 3. Đảm bảo Docker Services đang chạy

```bash
# Start các services trong Docker (trừ Kra)
docker-compose up -d mysql redis s3 server client ark

# Kiểm tra các services đã sẵn sàng
docker-compose ps

# Kiểm tra ports đã được expose
netstat -tulpn | grep -E ':(3001|6379|5000)'
```

## 🚀 Chạy Kra Service

### Cách 1: Chạy trực tiếp

```bash
cd Kra
cargo run --release
```

### Cách 2: Chạy binary đã build

```bash
cd Kra
./target/release/Kra
```

### Cách 3: Chạy như service (systemd)

Tạo file `/etc/systemd/system/kra-tognoek.service`:

```ini
[Unit]
Description=Kra Tognoek Worker Service
After=network.target docker.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/kra-tognoek/Kra
EnvironmentFile=/path/to/kra-tognoek/Kra/.env
ExecStart=/path/to/kra-tognoek/Kra/target/release/Kra
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable và start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable kra-tognoek
sudo systemctl start kra-tognoek
sudo systemctl status kra-tognoek
```

## 🔍 Kiểm tra

### 1. Kiểm tra Kra đang chạy

```bash
# Xem process
ps aux | grep Kra

# Xem logs (nếu chạy trực tiếp)
# Logs sẽ hiển thị trên console

# Xem logs (nếu chạy systemd)
sudo journalctl -u kra-tognoek -f
```

### 2. Kiểm tra Web UI

Truy cập: http://localhost:4000

Bạn sẽ thấy form để test Kra worker thủ công.

### 3. Kiểm tra kết nối Redis

```bash
# Từ Kra container hoặc máy host
redis-cli -h localhost -p 6379 ping
# Nên trả về: PONG
```

### 4. Kiểm tra kết nối S3

```bash
curl http://localhost:3001/
# Nên trả về HTML upload page
```

### 5. Test Job Flow

1. Nộp bài từ Client (http://localhost:3000)
2. Kiểm tra logs của Kra để xem job được xử lý
3. Kiểm tra kết quả trên Client

## 🐛 Troubleshooting

### Kra không kết nối được Redis

**Triệu chứng**: `Connection refused` hoặc `BLPOP timeout`

**Giải pháp**:
```bash
# Kiểm tra Redis trong Docker đang chạy
docker-compose ps redis

# Kiểm tra port 6379 đã được expose
netstat -tulpn | grep 6379

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Kra không kết nối được S3

**Triệu chứng**: `Failed to download bundle` hoặc `Connection refused`

**Giải pháp**:
```bash
# Kiểm tra S3 trong Docker đang chạy
docker-compose ps s3

# Kiểm tra port 3001 đã được expose
netstat -tulpn | grep 3001

# Test connection
curl http://localhost:3001/
```

### Callback không hoạt động

**Triệu chứng**: Submissions mãi ở trạng thái "Đang chấm..."

**Giải pháp**:
1. Kiểm tra `WORKER_SECRET` trong Kra/.env **phải giống** với Server/.env
2. Kiểm tra Server đang chạy: `docker-compose ps server`
3. Kiểm tra port 5000: `netstat -tulpn | grep 5000`
4. Xem logs của Kra để xem có lỗi callback không

### Isolate không hoạt động

**Triệu chứng**: `isolate: command not found` hoặc permission denied

**Giải pháp**:
```bash
# Kiểm tra isolate đã cài
which isolate

# Kiểm tra quyền
ls -l /usr/local/bin/isolate
# Nên có: -rwsr-xr-x (có setuid bit)

# Cấp quyền lại
sudo chown root:root /usr/local/bin/isolate
sudo chmod u+s /usr/local/bin/isolate
```

### Port 4000 đã được sử dụng

**Triệu chứng**: `Address already in use` khi start Kra

**Giải pháp**:
```bash
# Tìm process đang dùng port 4000
lsof -ti:4000
# Hoặc
netstat -tulpn | grep 4000

# Kill process
kill -9 $(lsof -ti:4000)

# Hoặc đổi port trong Kra/.env
KRA_WEB_PORT=4001
```

## 📝 Notes

- **Kra chạy bên ngoài Docker** để có thể sử dụng isolate
- **Các services khác** (MySQL, Redis, S3, Server, Client, Ark) chạy trong Docker
- **Kết nối**: Kra kết nối với Docker services qua `localhost` với các ports được expose
- **Network**: Không cần join Docker network, chỉ cần ports được expose
- **Security**: Đảm bảo isolate được cấu hình đúng để chạy code an toàn

## 🔄 Workflow

1. **Start Docker services**: `docker-compose up -d` (không có Kra)
2. **Start Kra bên ngoài**: `cd Kra && cargo run --release`
3. **Kra nhận job** từ Redis (localhost:6379)
4. **Kra download bundle** từ S3 (localhost:3001)
5. **Kra compile và chạy** code với isolate
6. **Kra gửi callback** về Server (localhost:5000)

## 🎯 Quick Start Script

Tạo file `start-kra.sh`:

```bash
#!/bin/bash

cd "$(dirname "$0")/Kra"

# Kiểm tra .env
if [ ! -f .env ]; then
    echo "⚠️  .env not found. Copying from .env.docker.example..."
    cp .env.docker.example .env
    echo "✅ Created .env. Please edit it with your configuration."
    exit 1
fi

# Build nếu chưa có binary
if [ ! -f target/release/Kra ]; then
    echo "📦 Building Kra..."
    cargo build --release
fi

# Chạy Kra
echo "🚀 Starting Kra service..."
./target/release/Kra
```

Chạy:
```bash
chmod +x start-kra.sh
./start-kra.sh
```

