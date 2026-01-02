# ==============================
# RESET & LÀM SẠCH DOCKER 100%
# ==============================

# Dừng toàn bộ container đang chạy
```
docker stop $(docker ps -q) 2>/dev/null || true
```
# Xóa toàn bộ container
```
docker rm -f $(docker ps -aq) 2>/dev/null || true
```
# Xóa toàn bộ image
```
docker rmi -f $(docker images -aq) 2>/dev/null || true
```
# Xóa toàn bộ volume (xóa dữ liệu DB)
````
docker volume rm $(docker volume ls -q) 2>/dev/null || true
```
# Xóa toàn bộ network (trừ network mặc định)
```
docker network rm $(docker network ls -q) 2>/dev/null || true
```
# Dọn sạch toàn bộ docker: cache, build, data thừa
```
docker system prune -a --volumes -f
```
# ==============================
# (TUỲ CHỌN) LINUX – SẠCH NHƯ MỚI CÀI
# ==============================
# sudo systemctl stop docker
# sudo rm -rf /var/lib/docker
# sudo rm -rf /var/lib/containerd
# sudo systemctl start docker
