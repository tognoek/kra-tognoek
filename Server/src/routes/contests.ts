import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/contests
router.get("/", async (_req, res) => {
  const data = await prisma.cuocThi.findMany({
    include: {
      taiKhoan: true,
      deBais: { include: { deBai: true } },
      dangKys: true,
    },
    orderBy: { NgayTao: "desc" },
  });
  res.json(data);
});

// POST /api/contests
router.post("/", async (req, res) => {
  const {
    IdTaiKhoan,
    TenCuocThi,
    MoTa,
    ThoiGianBatDau,
    ThoiGianKetThuc,
    TrangThai = true,
    ChuY,
    problems,
  } = req.body;

  if (!IdTaiKhoan || !TenCuocThi || !MoTa || !ThoiGianBatDau || !ThoiGianKetThuc) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const created = await prisma.cuocThi.create({
    data: {
      IdTaiKhoan,
      TenCuocThi,
      MoTa,
      ThoiGianBatDau: new Date(ThoiGianBatDau),
      ThoiGianKetThuc: new Date(ThoiGianKetThuc),
      TrangThai,
      ChuY,
      deBais: problems?.length
        ? { create: problems.map((p: any) => ({ IdDeBai: BigInt(p.IdDeBai), TenHienThi: p.TenHienThi })) }
        : undefined,
    },
  });
  res.json(created);
});

// POST /api/contests/:id/register
router.post("/:id/register", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdTaiKhoan } = req.body;
  if (!IdTaiKhoan) return res.status(400).json({ error: "IdTaiKhoan required" });
  const created = await prisma.cuocThi_DangKy.create({
    data: { IdCuocThi: contestId, IdTaiKhoan },
  });
  res.json(created);
});

export default router;

