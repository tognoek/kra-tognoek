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
  `Code` text,
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


INSERT INTO VaiTro (TenVaiTro, MoTa) VALUES
('Admin', 'Quản trị viên hệ thống'),
('User', 'Người dùng thông thường'),
('Create', 'Người tạo đề thi');

INSERT INTO TaiKhoan (IdVaiTro, TenDangNhap, MatKhau, HoTen, Email, TrangThai, NgayTao) VALUES
(1, 'admin',  '$2a$10$XcT.dgeSFa7vyySvO7e39uUCLiXsT943pMPK751gBvWM8NQ8.r4/.',  'Kra', 'kra-tognoek@kra.tognoek', TRUE,  NOW());