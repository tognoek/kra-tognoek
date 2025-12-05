import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/topics
router.get("/", async (_req, res) => {
  const data = await prisma.chuDe.findMany();
  res.json(data);
});

// POST /api/topics
router.post("/", async (req, res) => {
  const { TenChuDe, MoTa } = req.body;
  if (!TenChuDe) return res.status(400).json({ error: "TenChuDe is required" });
  const created = await prisma.chuDe.create({ data: { TenChuDe, MoTa } });
  res.json(created);
});

export default router;

