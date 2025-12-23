-- File seed data để fake dữ liệu submissions cho dễ thấy biểu đồ
-- Chạy file này sau khi đã tạo schema từ code.sql

-- Xóa dữ liệu cũ (nếu cần)
-- DELETE FROM BaiNop;
-- DELETE FROM TaiKhoan WHERE IdTaiKhoan > 3;
-- DELETE FROM DeBai WHERE IdDeBai > 1;

-- Thêm một số users mẫu
INSERT INTO TaiKhoan (IdVaiTro, TenDangNhap, MatKhau, HoTen, Email, TrangThai, NgayTao) VALUES
(2, 'user2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn A', 'user2@example.com', TRUE, DATE_SUB(NOW(), INTERVAL 60 DAY)),
(2, 'user3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị B', 'user3@example.com', TRUE, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(2, 'user4', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Văn C', 'user4@example.com', TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE TenDangNhap=TenDangNhap;

-- Thêm một số đề bài mẫu
INSERT INTO DeBai (IdTaiKhoan, TieuDe, NoiDungDeBai, DoKho, GioiHanThoiGian, GioiHanBoNho, DangCongKhai, NgayTao, TrangThai) VALUES
(1, 'Tìm số lớn nhất', 'Cho một mảng số nguyên, tìm số lớn nhất trong mảng.', 'Easy', 1000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 50 DAY), TRUE),
(1, 'Tính tổng mảng', 'Cho một mảng số nguyên, tính tổng các phần tử.', 'Easy', 1000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 40 DAY), TRUE),
(1, 'Kiểm tra số nguyên tố', 'Kiểm tra một số có phải số nguyên tố không.', 'Medium', 2000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY), TRUE),
(1, 'Tìm kiếm nhị phân', 'Tìm một phần tử trong mảng đã sắp xếp bằng tìm kiếm nhị phân.', 'Medium', 1000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 20 DAY), TRUE),
(1, 'Sắp xếp nhanh', 'Sắp xếp mảng bằng thuật toán Quick Sort.', 'Hard', 3000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY), TRUE)
ON DUPLICATE KEY UPDATE TieuDe=TieuDe;

-- Lấy ID của các users và đề bài vừa tạo (hoặc đã có)
SET @user1_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user1' LIMIT 1);
SET @user2_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user2' LIMIT 1);
SET @user3_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user3' LIMIT 1);
SET @user4_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user4' LIMIT 1);
SET @deBai1_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'A + B Problem' LIMIT 1);
SET @deBai2_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tìm số lớn nhất' LIMIT 1);
SET @deBai3_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tính tổng mảng' LIMIT 1);
SET @deBai4_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Kiểm tra số nguyên tố' LIMIT 1);
SET @ngonNgu1_id = (SELECT IdNgonNgu FROM NgonNgu WHERE TenNgonNgu = 'C++' LIMIT 1);

-- Tạo fake submissions trong 60 ngày qua (rải đều để có dữ liệu đẹp)
-- User 1: Nhiều submissions trong tháng gần đây
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
-- 30 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 50, 1024, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 45, 1024, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 2 HOUR),
-- 29 ngày trước
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 100, 2048, DATE_SUB(NOW(), INTERVAL 29 DAY)),
-- 28 ngày trước
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'wrong_answer', NULL, NULL, DATE_SUB(NOW(), INTERVAL 28 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 95, 2048, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 1 HOUR),
-- 27 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 150, 3072, DATE_SUB(NOW(), INTERVAL 27 DAY)),
-- 25 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'time_limit_exceeded', NULL, NULL, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 140, 3072, DATE_SUB(NOW(), INTERVAL 25 DAY) + INTERVAL 3 HOUR),
-- 24 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 200, 4096, DATE_SUB(NOW(), INTERVAL 24 DAY)),
-- 22 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'wrong_answer', NULL, NULL, DATE_SUB(NOW(), INTERVAL 22 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 195, 4096, DATE_SUB(NOW(), INTERVAL 22 DAY) + INTERVAL 2 HOUR),
-- 20 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 48, 1024, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 98, 2048, DATE_SUB(NOW(), INTERVAL 20 DAY) + INTERVAL 1 HOUR),
-- 18 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 145, 3072, DATE_SUB(NOW(), INTERVAL 18 DAY)),
-- 15 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 46, 1024, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 96, 2048, DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 2 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 148, 3072, DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 4 HOUR),
-- 12 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 198, 4096, DATE_SUB(NOW(), INTERVAL 12 DAY)),
-- 10 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 47, 1024, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 97, 2048, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 1 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 146, 3072, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 3 HOUR),
-- 8 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'wrong_answer', NULL, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 197, 4096, DATE_SUB(NOW(), INTERVAL 8 DAY) + INTERVAL 2 HOUR),
-- 7 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 49, 1024, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 99, 2048, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 1 HOUR),
-- 5 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 147, 3072, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 196, 4096, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR),
-- 4 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 50, 1024, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 100, 2048, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 1 HOUR),
-- 3 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 149, 3072, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 199, 4096, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR),
-- 2 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 48, 1024, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 98, 2048, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 1 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 145, 3072, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR),
-- 1 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 198, 4096, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@user1_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 47, 1024, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR),
-- Hôm nay
(@user1_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 96, 2048, NOW() - INTERVAL 2 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 148, 3072, NOW() - INTERVAL 1 HOUR),
(@user1_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'pending', NULL, NULL, NOW());

-- User 2: Ít submissions hơn, rải đều
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(@user2_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 52, 1024, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(@user2_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 105, 2048, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(@user2_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 155, 3072, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@user2_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'wrong_answer', NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@user2_id, @deBai4_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 205, 4096, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 1 HOUR),
(@user2_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 51, 1024, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@user2_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 101, 2048, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- User 3: Rất ít submissions
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(@user3_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 55, 1024, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@user3_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 110, 2048, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@user3_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 160, 3072, DATE_SUB(NOW(), INTERVAL 7 DAY));

-- User 4: Mới đăng ký, chỉ có vài submissions gần đây
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(@user4_id, @deBai1_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 53, 1024, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@user4_id, @deBai2_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 103, 2048, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@user4_id, @deBai3_id, @ngonNgu1_id, 'http://127.0.0.1:3001/data/code/1.cpp', 'accepted', 152, 3072, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Lưu ý: MatKhau hash ở trên là hash của "123456" (để test dễ)
-- Bạn có thể tạo hash mới bằng bcrypt với cost 10

