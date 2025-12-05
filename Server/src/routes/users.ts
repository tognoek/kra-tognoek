import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/users
router.get("/", async (_req, res) => {
  const data = await prisma.taiKhoan.findMany({
    include: { vaiTro: true },
  });
  res.json(data);
});

// POST /api/users
router.post("/", async (req, res) => {
  const { IdVaiTro, TenDangNhap, MatKhau, HoTen, Email } = req.body;
  if (!IdVaiTro || !TenDangNhap || !MatKhau || !HoTen || !Email) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const created = await prisma.taiKhoan.create({
    data: { IdVaiTro, TenDangNhap, MatKhau, HoTen, Email },
  });
  res.json(created);
});

export default router;

