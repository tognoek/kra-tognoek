import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Tạo các vai trò
  const adminRole = await prisma.vaiTro.upsert({
    where: { TenVaiTro: "Admin" },
    update: {},
    create: {
      TenVaiTro: "Admin",
      MoTa: "Quản trị viên hệ thống",
    },
  });

  const userRole = await prisma.vaiTro.upsert({
    where: { TenVaiTro: "User" },
    update: {},
    create: {
      TenVaiTro: "User",
      MoTa: "Người dùng thông thường",
    },
  });

  console.log("✅ Roles created");

  // Tạo admin mặc định
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.taiKhoan.upsert({
    where: { TenDangNhap: "admin" },
    update: {},
    create: {
      TenDangNhap: "admin",
      MatKhau: hashedPassword,
      HoTen: "Administrator",
      Email: "admin@oj.local",
      IdVaiTro: adminRole.IdVaiTro,
    },
  });

  console.log("✅ Admin user created (username: admin, password: admin123)");

  // Tạo các ngôn ngữ
  const languages = [
    { TenNgonNgu: "C++", TenNhanDien: "cpp" },
    { TenNgonNgu: "C", TenNhanDien: "c" },
    { TenNgonNgu: "Java", TenNhanDien: "java" },
    { TenNgonNgu: "Python", TenNhanDien: "py" },
  ];

  for (const lang of languages) {
    await prisma.ngonNgu.upsert({
      where: { TenNgonNgu: lang.TenNgonNgu },
      update: {},
      create: lang,
    });
  }

  console.log("✅ Languages created");

  // Tạo một số chủ đề mẫu
  const topics = [
    { TenChuDe: "Array", MoTa: "Các bài toán về mảng" },
    { TenChuDe: "String", MoTa: "Các bài toán về chuỗi" },
    { TenChuDe: "Dynamic Programming", MoTa: "Quy hoạch động" },
    { TenChuDe: "Graph", MoTa: "Đồ thị" },
    { TenChuDe: "Math", MoTa: "Toán học" },
  ];

  for (const topic of topics) {
    await prisma.chuDe.upsert({
      where: { TenChuDe: topic.TenChuDe },
      update: {},
      create: topic,
    });
  }

  console.log("✅ Topics created");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

