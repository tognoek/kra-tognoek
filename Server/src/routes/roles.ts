import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/roles
router.get("/", async (_req, res) => {
  const data = await prisma.vaiTro.findMany();
  res.json(data);
});

// POST /api/roles
router.post("/", async (req, res) => {
  const { TenVaiTro, MoTa } = req.body;
  if (!TenVaiTro) return res.status(400).json({ error: "TenVaiTro is required" });
  const created = await prisma.vaiTro.create({ data: { TenVaiTro, MoTa } });
  res.json(created);
});

export default router;

