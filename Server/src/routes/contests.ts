import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/contests
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.cuocThi.findMany({
      include: {
        deBais: { include: { deBai: true } },
      },
      orderBy: { NgayTao: "desc" },
    });

    res.json(
      data.map((c) => ({
        IdCuocThi: c.IdCuocThi.toString(),
        IdTaiKhoan: c.IdTaiKhoan.toString(),
        TenCuocThi: c.TenCuocThi,
        MoTa: c.MoTa,
        ThoiGianBatDau: c.ThoiGianBatDau,
        ThoiGianKetThuc: c.ThoiGianKetThuc,
        TrangThai: c.TrangThai,
        NgayTao: c.NgayTao,
        ChuY: c.ChuY,
        deBais: c.deBais.map((d) => ({
          IdCuocThi: d.IdCuocThi.toString(),
          IdDeBai: d.IdDeBai.toString(),
          TenHienThi: d.TenHienThi,
          deBai: d.deBai
            ? {
                IdDeBai: d.deBai.IdDeBai.toString(),
                TieuDe: d.deBai.TieuDe,
              }
            : null,
        })),
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load contests" });
  }
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

