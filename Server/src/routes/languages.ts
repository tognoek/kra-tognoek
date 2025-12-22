import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/languages
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.ngonNgu.findMany();
    res.json(
      data.map((l) => ({
        IdNgonNgu: l.IdNgonNgu.toString(),
        TenNgonNgu: l.TenNgonNgu,
        TenNhanDien: l.TenNhanDien,
        TrangThai: l.TrangThai,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load languages" });
  }
});

// POST /api/languages
router.post("/", async (req, res) => {
  const { TenNgonNgu, TenNhanDien, TrangThai } = req.body;
  if (!TenNgonNgu || !TenNhanDien) return res.status(400).json({ error: "Missing fields" });
  const created = await prisma.ngonNgu.create({
    data: { TenNgonNgu, TenNhanDien, TrangThai: TrangThai ?? true },
  });
  res.json(created);
});

export default router;

