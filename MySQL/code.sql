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
  `NgayTao` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP)
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
  `DuongDanInput` text NOT NULL,
  `DuongDanOutput` text NOT NULL,
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


-- Dữ liệu mẫu
-- Lưu ý: MatKhau nên là hash bcrypt. Ở đây đặt placeholder, bạn thay bằng hash thực tế
INSERT INTO VaiTro (IdVaiTro, TenVaiTro, MoTa) VALUES
(1, 'Admin', 'Quản trị viên hệ thống'),
(2, 'User', 'Người dùng thông thường'),
(3, 'Banned', 'Tài khoản bị khóa');

INSERT INTO TaiKhoan (IdTaiKhoan, IdVaiTro, TenDangNhap, MatKhau, HoTen, Email, TrangThai, NgayTao) VALUES
(1, 1, 'admin',  'HASH_BCRYPT_ADMIN123',  'Administrator', 'admin@oj.local', TRUE,  NOW()),
(2, 2, 'user1',  'HASH_BCRYPT_USER123',   'Người Dùng 1',  'user1@example.com', TRUE, NOW()),
(3, 3, 'banned1','HASH_BCRYPT_BANNED123', 'User Bị Khóa',  'banned1@example.com', FALSE, NOW());

INSERT INTO ChuDe (IdChuDe, TenChuDe, MoTa) VALUES
(1, 'Array', 'Các bài toán về mảng'),
(2, 'Math', 'Các bài toán toán học'),
(3, 'String', 'Xử lý chuỗi');

INSERT INTO NgonNgu (IdNgonNgu, TenNgonNgu, TenNhanDien, TrangThai) VALUES
(1, 'C++', 'cpp', TRUE),
(2, 'C',   'c',   TRUE),
(3, 'Python', 'py', TRUE),
(4, 'Java', 'java', FALSE);

INSERT INTO DeBai (IdDeBai, IdTaiKhoan, TieuDe, NoiDungDeBai, DoKho,
                   GioiHanThoiGian, GioiHanBoNho, DangCongKhai, NgayTao, TrangThai) VALUES
(1, 1, 'A + B Problem',
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
 'Easy', 1000, 262144, TRUE, NOW(), TRUE);

INSERT INTO DeBai_ChuDe (IdDeBai, IdChuDe) VALUES
(1, 1), (1, 2);

INSERT INTO BoTest (IdBoTest, IdDeBai, DuongDanInput, DuongDanOutput, DuongDanCode, NgayTao) VALUES
(1, 1,
 'http://127.0.0.1:3001/data/test/sum/sum.zip',
 'http://127.0.0.1:3001/data/test/sum/sum.zip',
 'http://127.0.0.1:3001/data/code/1.cpp',
 NOW());

INSERT INTO CuocThi (IdCuocThi, IdTaiKhoan, TenCuocThi, MoTa,
                     ThoiGianBatDau, ThoiGianKetThuc, TrangThai, NgayTao, ChuY) VALUES
(1, 1, 'Weekly Contest #1',
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

INSERT INTO CuocThi_DeBai (IdCuocThi, IdDeBai, TenHienThi) VALUES
(1, 1, 'Problem A - A + B');

INSERT INTO CuocThi_DangKy (IdCuocThi, IdTaiKhoan, TrangThai) VALUES
(1, 2, TRUE);

INSERT INTO BaiNop (IdBaiNop, IdTaiKhoan, IdDeBai, IdNgonNgu, IdCuocThi,
                    DuongDanCode, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES
(1, 2, 1, 1, 1,
 'http://127.0.0.1:3001/data/code/1.cpp',
 'pending', NULL, NULL, NOW());