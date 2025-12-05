#!/usr/bin/env bash

# Start all services: S3, Kra, Server, FE
# Each service runs in background

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting services..."

cd "$ROOT_DIR/S3"
cargo run &
echo "[S3] Started (cargo run)"

cd "$ROOT_DIR/Kra"
cargo run &
echo "[Kra] Started (cargo run)"

cd "$ROOT_DIR/Server"
npm run dev &
echo "[Server] Started (npm run dev)"

cd "$ROOT_DIR/FE"
npm run dev &
echo "[FE] Started (npm run dev)"

echo ""
echo "All services started!"
echo "Press Ctrl+C to stop all services"

wait
