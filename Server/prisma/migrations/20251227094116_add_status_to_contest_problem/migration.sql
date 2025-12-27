-- CreateTable
CREATE TABLE `VaiTro` (
    `IdVaiTro` BIGINT NOT NULL AUTO_INCREMENT,
    `TenVaiTro` VARCHAR(191) NOT NULL,
    `MoTa` TEXT NULL,

    UNIQUE INDEX `VaiTro_TenVaiTro_key`(`TenVaiTro`),
    PRIMARY KEY (`IdVaiTro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaiKhoan` (
    `IdTaiKhoan` BIGINT NOT NULL AUTO_INCREMENT,
    `IdVaiTro` BIGINT NOT NULL,
    `TenDangNhap` VARCHAR(191) NOT NULL,
    `MatKhau` VARCHAR(191) NOT NULL,
    `HoTen` VARCHAR(191) NOT NULL,
    `Email` VARCHAR(191) NOT NULL,
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,
    `NgayTao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TaiKhoan_TenDangNhap_key`(`TenDangNhap`),
    UNIQUE INDEX `TaiKhoan_Email_key`(`Email`),
    PRIMARY KEY (`IdTaiKhoan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChuDe` (
    `IdChuDe` BIGINT NOT NULL AUTO_INCREMENT,
    `TenChuDe` VARCHAR(191) NOT NULL,
    `MoTa` TEXT NULL,

    UNIQUE INDEX `ChuDe_TenChuDe_key`(`TenChuDe`),
    PRIMARY KEY (`IdChuDe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeBai` (
    `IdDeBai` BIGINT NOT NULL AUTO_INCREMENT,
    `IdTaiKhoan` BIGINT NOT NULL,
    `TieuDe` VARCHAR(191) NOT NULL,
    `NoiDungDeBai` TEXT NOT NULL,
    `DoKho` VARCHAR(191) NOT NULL,
    `GioiHanThoiGian` INTEGER NOT NULL,
    `GioiHanBoNho` INTEGER NOT NULL,
    `DangCongKhai` BOOLEAN NOT NULL DEFAULT true,
    `NgayTao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`IdDeBai`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeBai_ChuDe` (
    `IdDeBai` BIGINT NOT NULL,
    `IdChuDe` BIGINT NOT NULL,

    PRIMARY KEY (`IdDeBai`, `IdChuDe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BinhLuan` (
    `IdBinhLuan` BIGINT NOT NULL AUTO_INCREMENT,
    `IdDeBai` BIGINT NOT NULL,
    `IdTaiKhoan` BIGINT NOT NULL,
    `IdBinhLuanCha` BIGINT NULL,
    `NoiDung` TEXT NOT NULL,
    `NgayTao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`IdBinhLuan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BoTest` (
    `IdBoTest` BIGINT NOT NULL AUTO_INCREMENT,
    `IdDeBai` BIGINT NOT NULL,
    `DuongDanInput` VARCHAR(191) NULL,
    `DuongDanOutput` VARCHAR(191) NULL,
    `DuongDanCode` VARCHAR(191) NULL,
    `NgayTao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`IdBoTest`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuocThi` (
    `IdCuocThi` BIGINT NOT NULL AUTO_INCREMENT,
    `IdTaiKhoan` BIGINT NOT NULL,
    `TenCuocThi` VARCHAR(191) NOT NULL,
    `MoTa` TEXT NOT NULL,
    `ThoiGianBatDau` DATETIME(3) NOT NULL,
    `ThoiGianKetThuc` DATETIME(3) NOT NULL,
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,
    `NgayTao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ChuY` TEXT NULL,

    PRIMARY KEY (`IdCuocThi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuocThi_DeBai` (
    `IdCuocThi` BIGINT NOT NULL,
    `IdDeBai` BIGINT NOT NULL,
    `TenHienThi` TEXT NULL,
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`IdCuocThi`, `IdDeBai`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuocThi_DangKy` (
    `IdCuocThi` BIGINT NOT NULL,
    `IdTaiKhoan` BIGINT NOT NULL,
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`IdCuocThi`, `IdTaiKhoan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NgonNgu` (
    `IdNgonNgu` BIGINT NOT NULL AUTO_INCREMENT,
    `TenNgonNgu` VARCHAR(191) NOT NULL,
    `TenNhanDien` VARCHAR(191) NOT NULL,
    `TrangThai` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `NgonNgu_TenNgonNgu_key`(`TenNgonNgu`),
    PRIMARY KEY (`IdNgonNgu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaiNop` (
    `IdBaiNop` BIGINT NOT NULL AUTO_INCREMENT,
    `IdTaiKhoan` BIGINT NOT NULL,
    `IdDeBai` BIGINT NOT NULL,
    `IdNgonNgu` BIGINT NOT NULL,
    `IdCuocThi` BIGINT NULL,
    `DuongDanCode` VARCHAR(191) NOT NULL,
    `TrangThaiCham` VARCHAR(191) NULL,
    `ThoiGianThucThi` INTEGER NULL,
    `BoNhoSuDung` INTEGER NULL,
    `NgayNop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`IdBaiNop`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TaiKhoan` ADD CONSTRAINT `TaiKhoan_IdVaiTro_fkey` FOREIGN KEY (`IdVaiTro`) REFERENCES `VaiTro`(`IdVaiTro`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeBai` ADD CONSTRAINT `DeBai_IdTaiKhoan_fkey` FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan`(`IdTaiKhoan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeBai_ChuDe` ADD CONSTRAINT `DeBai_ChuDe_IdDeBai_fkey` FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai`(`IdDeBai`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeBai_ChuDe` ADD CONSTRAINT `DeBai_ChuDe_IdChuDe_fkey` FOREIGN KEY (`IdChuDe`) REFERENCES `ChuDe`(`IdChuDe`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BinhLuan` ADD CONSTRAINT `BinhLuan_IdDeBai_fkey` FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai`(`IdDeBai`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BinhLuan` ADD CONSTRAINT `BinhLuan_IdTaiKhoan_fkey` FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan`(`IdTaiKhoan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BinhLuan` ADD CONSTRAINT `BinhLuan_IdBinhLuanCha_fkey` FOREIGN KEY (`IdBinhLuanCha`) REFERENCES `BinhLuan`(`IdBinhLuan`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoTest` ADD CONSTRAINT `BoTest_IdDeBai_fkey` FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai`(`IdDeBai`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuocThi` ADD CONSTRAINT `CuocThi_IdTaiKhoan_fkey` FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan`(`IdTaiKhoan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuocThi_DeBai` ADD CONSTRAINT `CuocThi_DeBai_IdCuocThi_fkey` FOREIGN KEY (`IdCuocThi`) REFERENCES `CuocThi`(`IdCuocThi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuocThi_DeBai` ADD CONSTRAINT `CuocThi_DeBai_IdDeBai_fkey` FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai`(`IdDeBai`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuocThi_DangKy` ADD CONSTRAINT `CuocThi_DangKy_IdCuocThi_fkey` FOREIGN KEY (`IdCuocThi`) REFERENCES `CuocThi`(`IdCuocThi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuocThi_DangKy` ADD CONSTRAINT `CuocThi_DangKy_IdTaiKhoan_fkey` FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan`(`IdTaiKhoan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaiNop` ADD CONSTRAINT `BaiNop_IdTaiKhoan_fkey` FOREIGN KEY (`IdTaiKhoan`) REFERENCES `TaiKhoan`(`IdTaiKhoan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaiNop` ADD CONSTRAINT `BaiNop_IdDeBai_fkey` FOREIGN KEY (`IdDeBai`) REFERENCES `DeBai`(`IdDeBai`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaiNop` ADD CONSTRAINT `BaiNop_IdNgonNgu_fkey` FOREIGN KEY (`IdNgonNgu`) REFERENCES `NgonNgu`(`IdNgonNgu`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaiNop` ADD CONSTRAINT `BaiNop_IdCuocThi_fkey` FOREIGN KEY (`IdCuocThi`) REFERENCES `CuocThi`(`IdCuocThi`) ON DELETE SET NULL ON UPDATE CASCADE;
