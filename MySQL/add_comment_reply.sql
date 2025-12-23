-- Migration: Add reply support to comments
-- Add IdBinhLuanCha field to BinhLuan table

ALTER TABLE `binhluan` 
ADD COLUMN `IdBinhLuanCha` BIGINT NULL AFTER `IdTaiKhoan`;

-- Add foreign key constraint
ALTER TABLE `binhluan`
ADD CONSTRAINT `FK_BinhLuan_Reply` 
FOREIGN KEY (`IdBinhLuanCha`) 
REFERENCES `binhluan` (`IdBinhLuan`) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

