import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/languages
router.get("/", async (_req, res) => {
  const data = await prisma.ngonNgu.findMany();
  res.json(data);
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

