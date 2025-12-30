import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await prisma.vaiTro.findMany();
    res.json(
      data.map((r) => ({
        IdVaiTro: r.IdVaiTro.toString(),
        TenVaiTro: r.TenVaiTro,
        MoTa: r.MoTa,
      }))
    );
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: error.message || "Failed to load roles" });
  }
});

router.post("/", async (req, res) => {
  const { TenVaiTro, MoTa } = req.body;
  if (!TenVaiTro) return res.status(400).json({ error: "TenVaiTro is required" });
  const created = await prisma.vaiTro.create({ data: { TenVaiTro, MoTa } });
  res.json(created);
});

export default router;

