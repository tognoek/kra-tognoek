DROP DATABASE IF EXISTS `kra-tognoek`;
CREATE DATABASE `kra-tognoek`;
USE `kra-tognoek`;

-- Tạo bảng

CREATE TABLE `VaiTro` (
  `IdVaiTro` bigint PRIMARY KEY AUTO_INCREMENT,
  `TenVaiTro` varchar(255) UNIQUE NOT NULL,
  `MoTa` text
);

CREATE TABLE `TaiKhoan` (
  `IdTaiKhoan` bigint PRIMARY KEY AUTO_INCREMENT,
  `IdVaiTro` bigint NOT NULL,
  `TenDangNhap` varchar(100) UNIQUE NOT NULL,
  `MatKhau` varchar(255) NOT NULL,
  `HoTen` varchar(50) NOT NULL,
  `Email` varchar(255) UNIQUE NOT NULL,
  `TrangThai` boolean NOT NULL DEFAULT true,
  `NgayTao` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `IsVerified` boolean NOT NULL DEFAULT false,
  `FirebaseUid` varchar(255) UNIQUE DEFAULT NULL
);

CREATE TABLE `ChuDe` (
  `IdChuDe` bigint PRIMARY KEY AUTO_INCREMENT,
  `TenChuDe` varchar(255) UNIQUE NOT NULL,
  `MoTa` text
);

CREATE TABLE `DeBai` (
  `IdDeBai` bigint PRIMARY KEY AUTO_INCREMENT,
  `IdTaiKhoan` bigint NOT NULL,
  `TieuDe` varchar(255) NOT NULL,
  `NoiDungDeBai` text NOT NULL,
  `DoKho` varchar(50) NOT NULL,
  `GioiHanThoiGian` int NOT NULL,
  `GioiHanBoNho` int NOT NULL,
  `DangCongKhai` boolean NOT NULL DEFAULT true,
  `NgayTao` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `TrangThai` boolean NOT NULL DEFAULT true
);

CREATE TABLE `DeBai_ChuDe` (
  `IdDeBai` bigint NOT NULL,
  `IdChuDe` bigint NOT NULL,
  PRIMARY KEY (`IdDeBai`, `IdChuDe`)
);

CREATE TABLE `BinhLuan` (
  `IdBinhLuan` bigint PRIMARY KEY AUTO_INCREMENT,
  `IdDeBai` bigint NOT NULL,
  `IdTaiKhoan` bigint NOT NULL,
  `IdBinhLuanCha` bigint NULL,
  `NoiDung` text NOT NULL,
  `NgayTao` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `TrangThai` boolean NOT NULL DEFAULT true
);

CREATE TABLE `BoTest` (
  `IdBoTest` bigint PRIMARY KEY AUTO_INCREMENT,
  `IdDeBai` bigint NOT NULL,
  `DuongDanInput` text,
  `DuongDanOutput` text,
  `DuongDanCode` text NOT NULL,
  `NgayTao` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `CuocThi` (
  `IdCuocThi` bigint PRIMARY KEY AUTO_INCREMENT,
  `IdTaiKhoan` bigint NOT NULL,
  `TenCuocThi` varchar(255) NOT NULL,
  `MoTa` text NOT NULL,
  `ThoiGianBatDau` datetime NOT NULL,
  `ThoiGianKetThuc` datetime NOT NULL,
  `TrangThai` boolean NOT NULL DEFAULT true,
  `NgayTao` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `ChuY` text
);

CREATE TABLE `CuocThi_DeBai` (
  `IdCuocThi` bigint NOT NULL,
  `IdDeBai` bigint NOT NULL,
  `TenHienThi` text,
  `TrangThai` boolean NOT NULL DEFAULT true,
  PRIMARY KEY (`IdCuocThi`, `IdDeBai`)
);

CREATE TABLE `CuocThi_DangKy` (
  `IdCuocThi` bigint NOT NULL,
  `IdTaiKhoan` bigint NOT NULL,
  `TrangThai` boolean NOT NULL DEFAULT true,
  PRIMARY KEY (`IdCuocThi`, `IdTaiKhoan`)
);

CREATE TABLE `NgonNgu` (
  `IdNgonNgu` bigint PRIMARY KEY AUTO_INCREMENT,
  `TenNgonNgu` varchar(100) UNIQUE NOT NULL,
  `TenNhanDien` varchar(255) NOT NULL,
  `TrangThai` boolean NOT NULL DEFAULT true
);

CREATE TABLE `BaiNop` (
  `IdBaiNop` bigint PRIMARY KEY AUTO_INCREMENT,
  `IdTaiKhoan` bigint NOT NULL,
  `IdDeBai` bigint NOT NULL,
  `IdNgonNgu` bigint NOT NULL,
  `IdCuocThi` bigint,
  `DuongDanCode` text NOT NULL,
  `TrangThaiCham` text,
  `ThoiGianThucThi` int,
  `BoNhoSuDung` int,
  `NgayNop` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `BaiDang` (
    `IdBaiDang` BIGINT PRIMARY KEY  AUTO_INCREMENT,
    `IdTaiKhoan` BIGINT NOT NULL,
    `TieuDe` VARCHAR(255) NOT NULL,
    `NoiDung` TEXT NOT NULL,
    `UuTien` INT NOT NULL DEFAULT 1,
    `TrangThai` BOOLEAN NOT NULL DEFAULT TRUE,
    `NgayTao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `NgayCapNhat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

ALTER TABLE `TaiKhoan` ADD FOREIGN KEY (`IdVaiTro`) REFERENCES `VaiTro` (`IdVaiTro`);

ALTER TABLE `DeBai` ADD FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan` (`IdTaiKhoan`);

ALTER TABLE `DeBai_ChuDe` ADD FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai` (`IdDeBai`);

ALTER TABLE `DeBai_ChuDe` ADD FOREIGN KEY (`IdChuDe`) REFERENCES `ChuDe` (`IdChuDe`);

ALTER TABLE `BinhLuan` ADD FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai` (`IdDeBai`);

ALTER TABLE `BinhLuan` ADD FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan` (`IdTaiKhoan`);

ALTER TABLE `BinhLuan` ADD FOREIGN KEY (`IdBinhLuanCha`) REFERENCES `BinhLuan` (`IdBinhLuan`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BoTest` ADD FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai` (`IdDeBai`);

ALTER TABLE `CuocThi` ADD FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan` (`IdTaiKhoan`);

ALTER TABLE `CuocThi_DeBai` ADD FOREIGN KEY (`IdCuocThi`) REFERENCES `CuocThi` (`IdCuocThi`);

ALTER TABLE `CuocThi_DeBai` ADD FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai` (`IdDeBai`);

ALTER TABLE `CuocThi_DangKy` ADD FOREIGN KEY (`IdCuocThi`) REFERENCES `CuocThi` (`IdCuocThi`);

ALTER TABLE `CuocThi_DangKy` ADD FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan` (`IdTaiKhoan`);

ALTER TABLE `BaiNop` ADD FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan` (`IdTaiKhoan`);

ALTER TABLE `BaiNop` ADD FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai` (`IdDeBai`);

ALTER TABLE `BaiNop` ADD FOREIGN KEY (`IdNgonNgu`) REFERENCES `NgonNgu` (`IdNgonNgu`);

ALTER TABLE `BaiNop` ADD FOREIGN KEY (`IdCuocThi`) REFERENCES `CuocThi` (`IdCuocThi`);

ALTER TABLE `BaiDang` ADD FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan` (`IdTaiKhoan`);


-- Dữ liệu mẫu
-- Lưu ý: MatKhau nên là hash bcrypt. Ở đây đặt placeholder, bạn thay bằng hash thực tế
INSERT INTO VaiTro (TenVaiTro, MoTa) VALUES
('Admin', 'Quản trị viên hệ thống'),
('User', 'Người dùng thông thường'),
('Create', 'Người tạo đề thi');

INSERT INTO TaiKhoan (IdVaiTro, TenDangNhap, MatKhau, HoTen, Email, TrangThai, NgayTao) VALUES
(1, 'admin',  '$2a$10$wfeuSdGOP5Ns5fReRB8hkuCzzp6RtNVQ0pLDIH.ozF.19b7pvMhTu',  'Administrator', 'admin@oj.local', TRUE,  NOW()),
(3, 'tognoek',  '$2a$10$wfeuSdGOP5Ns5fReRB8hkuCzzp6RtNVQ0pLDIH.ozF.19b7pvMhTu',  'tognoek', 'tognoek@gmail.com', TRUE,  NOW());
INSERT INTO ChuDe (TenChuDe, MoTa) VALUES
('Array', 'Các bài toán về mảng'),
('Math', 'Các bài toán toán học'),
('String', 'Xử lý chuỗi');

INSERT INTO NgonNgu (TenNgonNgu, TenNhanDien, TrangThai) VALUES
('C++', 'cpp', TRUE),
('C',   'c',   TRUE),
('Python', 'py', FALSE),
('Java', 'java', FALSE);

INSERT INTO DeBai (IdTaiKhoan, TieuDe, NoiDungDeBai, DoKho,
                   GioiHanThoiGian, GioiHanBoNho, DangCongKhai, NgayTao, TrangThai) VALUES
(1, 'A + B Problem',
'# A + B Problem

Cho hai số nguyên **A** và **B**.

## Input
- Một dòng chứa hai số nguyên A và B.

## Output
- In ra `A + B`.

### Giới hạn
- \\( -10^9 \\le A, B \\le 10^9 \\)

### Ví dụ

| Input    | Output |
|----------|--------|
| `1 2`    | `3`    |
| `-5 10`  | `5`    |
',
 1, 1000, 262144, TRUE, NOW(), TRUE);

INSERT INTO DeBai_ChuDe (IdDeBai, IdChuDe) VALUES
(1, 1), (1, 2);

INSERT INTO BoTest (IdDeBai, DuongDanInput, DuongDanOutput, DuongDanCode, NgayTao) VALUES
(1,
 null,
 null,
 'check.cpp',
 NOW());

INSERT INTO CuocThi (IdTaiKhoan, TenCuocThi, MoTa,
                     ThoiGianBatDau, ThoiGianKetThuc, TrangThai, NgayTao, ChuY) VALUES
(1, 'Weekly Contest #1',
'# Weekly Contest #1

Cuộc thi luyện tập lập trình hàng tuần.

## Thể lệ
- Thời gian: 120 phút
- Chấm tự động bằng hệ thống Kra + S3
- Ngôn ngữ cho phép: C, C++

## Lưu ý
- Không chia sẻ code khi contest còn đang diễn ra.',
 NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), TRUE, NOW(),
 'Mở cho tất cả user đã verify email.');

INSERT INTO CuocThi_DeBai (IdCuocThi, IdDeBai, TenHienThi, TrangThai) VALUES
(1, 1, 'Problem A - A + B', 1);

INSERT INTO CuocThi_DangKy (IdCuocThi, IdTaiKhoan, TrangThai) VALUES
(1, 1, TRUE);

INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, IdCuocThi,
                    DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(2, 1, 1, 1,
 '1.cpp',
 '[0,0,0,0,0]', 700, 2048, NOW());


-- Thêm một số users mẫu
INSERT INTO TaiKhoan (IdVaiTro, TenDangNhap, MatKhau, HoTen, Email, TrangThai, NgayTao) VALUES
(2, 'nguyenvanan', '$2a$10$$2a$10$wfeuSdGOP5Ns5fReRB8hkuCzzp6RtNVQ0pLDIH.ozF.19b7pvMhTu', 'Nguyễn Văn An', 'nguyenvanan@gmail.com', TRUE, DATE_SUB(NOW(), INTERVAL 60 DAY)),
(2, 'tranthibinh', '$2a$10$$2a$10$wfeuSdGOP5Ns5fReRB8hkuCzzp6RtNVQ0pLDIH.ozF.19b7pvMhTu', 'Trần Thị Bình', 'tranthibinh@gmail.com', TRUE, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(2, 'levancuong', '$2a$10$$2a$10$wfeuSdGOP5Ns5fReRB8hkuCzzp6RtNVQ0pLDIH.ozF.19b7pvMhTu', 'Lê Văn Cương', 'levancuong@gmail.com', TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, 'hoanvancanh', '$2a$10$$2a$10$wfeuSdGOP5Ns5fReRB8hkuCzzp6RtNVQ0pLDIH.ozF.19b7pvMhTu', 'Hoàng Văn Cảnh', 'hoanvancanh@gmail.com', TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE TenDangNhap=TenDangNhap;

-- Thêm một số đề bài mẫu
INSERT INTO DeBai (IdTaiKhoan, TieuDe, NoiDungDeBai, DoKho, GioiHanThoiGian, GioiHanBoNho, DangCongKhai, NgayTao, TrangThai) VALUES
(1, 'Tìm số lớn nhất', 'Cho một mảng số nguyên, tìm số lớn nhất trong mảng.', '1', 1000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 50 DAY), TRUE),
(1, 'Tính tổng mảng', 'Cho một mảng số nguyên, tính tổng các phần tử.', '1', 1000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 40 DAY), TRUE),
(1, 'Kiểm tra số nguyên tố', 'Kiểm tra một số có phải số nguyên tố không.', '7', 2000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 30 DAY), TRUE),
(1, 'Tìm kiếm nhị phân', 'Tìm một phần tử trong mảng đã sắp xếp bằng tìm kiếm nhị phân.', '7', 1000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 20 DAY), TRUE),
(1, 'Sắp xếp nhanh', 'Sắp xếp mảng bằng thuật toán Quick Sort.', '4', 3000, 262144, TRUE, DATE_SUB(NOW(), INTERVAL 10 DAY), TRUE)
ON DUPLICATE KEY UPDATE TieuDe=TieuDe;

-- Lấy ID của các users và đề bài vừa tạo (hoặc đã có)
SET @user1_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'tranthibinh' LIMIT 1);
SET @user2_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'tranthibinh' LIMIT 1);
SET @user3_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'levancuong' LIMIT 1);
SET @user4_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'hoanvancanh' LIMIT 1);
SET @deBai1_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'A + B Problem' LIMIT 1);
SET @deBai2_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tìm số lớn nhất' LIMIT 1);
SET @deBai3_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tính tổng mảng' LIMIT 1);
SET @deBai4_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Kiểm tra số nguyên tố' LIMIT 1);
SET @ngonNgu1_id = (SELECT IdNgonNgu FROM NgonNgu WHERE TenNgonNgu = 'C++' LIMIT 1);

-- Tạo fake submissions trong 60 ngày qua (rải đều để có dữ liệu đẹp)
-- User 1: Nhiều submissions trong tháng gần đây
-- Format: TrangThaiCham lưu JSON array [0,0,1,2,0] - 0=đúng, 1=sai, 2=timeout, 3=lỗi/biên dịch
-- Server sẽ tự xử lý từ TrangThaiCham để format thành accepted, wrong_answer:1/5, time_limit_exceeded, compile_error
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
-- 30 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 50, 1024, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 45, 1024, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 2 HOUR),
-- 29 ngày trước
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 100, 2048, DATE_SUB(NOW(), INTERVAL 29 DAY)),
-- 28 ngày trước
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,1,1,0]', NULL, NULL, DATE_SUB(NOW(), INTERVAL 28 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 95, 2048, DATE_SUB(NOW(), INTERVAL 28 DAY) + INTERVAL 1 HOUR),
-- 27 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 150, 3072, DATE_SUB(NOW(), INTERVAL 27 DAY)),
-- 25 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,2,2,0]', NULL, NULL, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 140, 3072, DATE_SUB(NOW(), INTERVAL 25 DAY) + INTERVAL 3 HOUR),
-- 24 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 200, 4096, DATE_SUB(NOW(), INTERVAL 24 DAY)),
-- 22 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[1,0,0,0,0]', NULL, NULL, DATE_SUB(NOW(), INTERVAL 22 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 195, 4096, DATE_SUB(NOW(), INTERVAL 22 DAY) + INTERVAL 2 HOUR),
-- 20 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 48, 1024, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 98, 2048, DATE_SUB(NOW(), INTERVAL 20 DAY) + INTERVAL 1 HOUR),
-- 18 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 145, 3072, DATE_SUB(NOW(), INTERVAL 18 DAY)),
-- 15 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 46, 1024, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 96, 2048, DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 2 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 148, 3072, DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 4 HOUR),
-- 12 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 198, 4096, DATE_SUB(NOW(), INTERVAL 12 DAY)),
-- 10 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 47, 1024, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 97, 2048, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 1 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 146, 3072, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 3 HOUR),
-- 8 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,1,1,0,0]', NULL, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 197, 4096, DATE_SUB(NOW(), INTERVAL 8 DAY) + INTERVAL 2 HOUR),
-- 7 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 49, 1024, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 99, 2048, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 1 HOUR),
-- 5 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 147, 3072, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 196, 4096, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR),
-- 4 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 50, 1024, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 100, 2048, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 1 HOUR),
-- 3 ngày trước
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 149, 3072, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 199, 4096, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR),
-- 2 ngày trước
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 48, 1024, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 98, 2048, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 1 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 145, 3072, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR),
-- 1 ngày trước
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 198, 4096, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(@user1_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 47, 1024, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR),
-- Hôm nay
(@user1_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 96, 2048, NOW() - INTERVAL 2 HOUR),
(@user1_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 148, 3072, NOW() - INTERVAL 1 HOUR),
(@user1_id, @deBai4_id, @ngonNgu1_id, '4.cpp', NULL, NULL, NULL, NOW());

-- User 2: Ít submissions hơn, rải đều
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(@user2_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 52, 1024, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(@user2_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 105, 2048, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(@user2_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 155, 3072, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@user2_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[1,0,0,0,0]', NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@user2_id, @deBai4_id, @ngonNgu1_id, '4.cpp', '[0,0,0,0,0]', 205, 4096, DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 1 HOUR),
(@user2_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 51, 1024, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@user2_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 101, 2048, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- User 3: Rất ít submissions
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(@user3_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 55, 1024, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@user3_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 110, 2048, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(@user3_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 160, 3072, DATE_SUB(NOW(), INTERVAL 7 DAY));

-- User 4: Mới đăng ký, chỉ có vài submissions gần đây
INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(@user4_id, @deBai1_id, @ngonNgu1_id, '1.cpp', '[0,0,0,0,0]', 53, 1024, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@user4_id, @deBai2_id, @ngonNgu1_id, '2.cpp', '[0,0,0,0,0]', 103, 2048, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(@user4_id, @deBai3_id, @ngonNgu1_id, '3.cpp', '[0,0,0,0,0]', 152, 3072, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Lưu ý: MatKhau hash ở trên là hash của "123456" (để test dễ)
-- Bạn có thể tạo hash mới bằng bcrypt với cost 10

-- File seed data để fake dữ liệu bình luận
-- Chạy file này sau khi đã chạy code.sql (đã có field IdBinhLuanCha)

-- Xóa dữ liệu cũ (nếu cần)
-- DELETE FROM BinhLuan;

-- Lấy ID của các users và đề bài
SET @user1_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'nguyenvanan' LIMIT 1);
SET @user2_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'tranthibinh' LIMIT 1);
SET @user3_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'levancuong' LIMIT 1);
SET @user4_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'hoanvancanh' LIMIT 1);
SET @admin_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'admin' LIMIT 1);

-- Lấy ID của các đề bài (chỉ lấy đề bài đã tồn tại)
SET @debai1_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'A + B Problem' LIMIT 1);
SET @debai2_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tìm số lớn nhất' LIMIT 1);
SET @debai3_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tính tổng mảng' LIMIT 1);
SET @debai4_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Kiểm tra số nguyên tố' LIMIT 1);

-- Thêm bình luận gốc (không có IdBinhLuanCha) - chỉ thêm nếu có đề bài và user
INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user2_id, NULL, 'Bài này khá dễ, mình làm được trong 5 phút! 👍', DATE_SUB(NOW(), INTERVAL 5 DAY), TRUE
WHERE @debai1_id IS NOT NULL AND @user2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user3_id, NULL, 'Có ai giải thích cách làm bài này không? Mình mới học lập trình.', DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE
WHERE @debai1_id IS NOT NULL AND @user3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user4_id, NULL, 'Bài này là bài đầu tiên mình làm được trên platform này, cảm ơn admin!', DATE_SUB(NOW(), INTERVAL 3 DAY), TRUE
WHERE @debai1_id IS NOT NULL AND @user4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user1_id, NULL, 'Bài này có thể dùng vòng lặp for đơn giản, hoặc dùng hàm max() nếu ngôn ngữ hỗ trợ.', DATE_SUB(NOW(), INTERVAL 6 DAY), TRUE
WHERE @debai2_id IS NOT NULL AND @user1_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user3_id, NULL, 'Mình nghĩ có thể optimize bằng cách chỉ duyệt một lần thôi.', DATE_SUB(NOW(), INTERVAL 5 DAY), TRUE
WHERE @debai2_id IS NOT NULL AND @user3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @admin_id, NULL, 'Đúng rồi! Độ phức tạp O(n) là tối ưu cho bài này.', DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE
WHERE @debai2_id IS NOT NULL AND @admin_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user2_id, NULL, 'Bài này tương tự bài trước, chỉ cần thay max() thành sum().', DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE
WHERE @debai3_id IS NOT NULL AND @user2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user4_id, NULL, 'Có ai test với mảng rỗng chưa? Kết quả nên là 0 đúng không?', DATE_SUB(NOW(), INTERVAL 3 DAY), TRUE
WHERE @debai3_id IS NOT NULL AND @user4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user1_id, NULL, 'Bài này cần kiến thức về số nguyên tố. Có thể dùng thuật toán Sieve of Eratosthenes để optimize.', DATE_SUB(NOW(), INTERVAL 7 DAY), TRUE
WHERE @debai4_id IS NOT NULL AND @user1_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user2_id, NULL, 'Mình làm bằng cách kiểm tra từ 2 đến sqrt(n), đã AC rồi!', DATE_SUB(NOW(), INTERVAL 6 DAY), TRUE
WHERE @debai4_id IS NOT NULL AND @user2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user3_id, NULL, 'Cảm ơn bạn user2, mình sẽ thử cách đó!', DATE_SUB(NOW(), INTERVAL 5 DAY), TRUE
WHERE @debai4_id IS NOT NULL AND @user3_id IS NOT NULL;

-- Lấy ID của các bình luận gốc vừa tạo để tạo replies
SET @comment2_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai1_id AND IdTaiKhoan = @user3_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment3_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai2_id AND IdTaiKhoan = @user1_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment4_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai2_id AND IdTaiKhoan = @user3_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment6_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai3_id AND IdTaiKhoan = @user4_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment7_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai4_id AND IdTaiKhoan = @user3_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);

-- Thêm replies (có IdBinhLuanCha) - chỉ thêm nếu có parent comment
INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user2_id, @comment2_id, 'Bạn có thể dùng phép cộng đơn giản: `a + b`. Nếu đọc từ input thì dùng scanf hoặc cin.', DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 2 HOUR, TRUE
WHERE @debai1_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @admin_id, @comment2_id, 'Đúng rồi! Đây là bài cơ bản nhất, chỉ cần đọc 2 số và in ra tổng. Chúc bạn học tốt!', DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 1 HOUR, TRUE
WHERE @debai1_id IS NOT NULL AND @admin_id IS NOT NULL AND @comment2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user4_id, @comment2_id, 'Mình cũng mới học, làm được rồi! Cảm ơn các bạn đã giúp đỡ.', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 12 HOUR, TRUE
WHERE @debai1_id IS NOT NULL AND @user4_id IS NOT NULL AND @comment2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user2_id, @comment3_id, 'Cảm ơn bạn! Mình cũng nghĩ vậy, nhưng không chắc có cách nào tốt hơn không.', DATE_SUB(NOW(), INTERVAL 5 DAY) - INTERVAL 3 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user4_id, @comment3_id, 'Mình dùng vòng lặp for, code rất ngắn gọn!', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 8 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @user4_id IS NOT NULL AND @comment3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user1_id, @comment4_id, 'Đúng rồi! Chỉ cần duyệt một lần là đủ, không cần sort hay làm gì phức tạp.', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 2 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @user1_id IS NOT NULL AND @comment4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @admin_id, @comment4_id, 'Chính xác! Độ phức tạp O(n) là tối ưu cho bài này.', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 1 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @admin_id IS NOT NULL AND @comment4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user2_id, @comment6_id, 'Đúng rồi! Nếu mảng rỗng thì tổng là 0. Bạn nhớ xử lý edge case này nhé!', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 6 HOUR, TRUE
WHERE @debai3_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment6_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user1_id, @comment6_id, 'Good catch! Luôn nhớ test với các trường hợp đặc biệt như mảng rỗng, mảng 1 phần tử, v.v.', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 4 HOUR, TRUE
WHERE @debai3_id IS NOT NULL AND @user1_id IS NOT NULL AND @comment6_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user2_id, @comment7_id, 'Không có gì! Chúc bạn làm được bài này. Nếu cần hỗ trợ thêm cứ hỏi nhé!', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 10 HOUR, TRUE
WHERE @debai4_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment7_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user1_id, @comment7_id, 'Nếu bạn muốn tối ưu hơn nữa, có thể dùng Sieve of Eratosthenes để precompute các số nguyên tố.', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 8 HOUR, TRUE
WHERE @debai4_id IS NOT NULL AND @user1_id IS NOT NULL AND @comment7_id IS NOT NULL;
