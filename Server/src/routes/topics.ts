import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await prisma.chuDe.findMany({
      orderBy: { IdChuDe: 'desc' }
    });

    res.json(
      data.map((t) => ({
        IdChuDe: t.IdChuDe.toString(),
        TenChuDe: t.TenChuDe,
        MoTa: t.MoTa,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

router.post("/", async (req, res) => {
  const { TenChuDe, MoTa } = req.body;
  if (!TenChuDe) return res.status(400).json({ error: "TenChuDe is required" });

  try {
    const created = await prisma.chuDe.create({
      data: { TenChuDe, MoTa: MoTa || "" },
    });

    res.json({
      IdChuDe: created.IdChuDe.toString(),
      TenChuDe: created.TenChuDe,
      MoTa: created.MoTa,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create topic" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { TenChuDe, MoTa } = req.body;

  try {
    const updated = await prisma.chuDe.update({
      where: { IdChuDe: BigInt(id) }, 
      data: {
        ...(TenChuDe && { TenChuDe }),
        ...(MoTa !== undefined && { MoTa }),
      },
    });

    res.json({
      IdChuDe: updated.IdChuDe.toString(),
      TenChuDe: updated.TenChuDe,
      MoTa: updated.MoTa,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update topic" });
  }
});

export default router;