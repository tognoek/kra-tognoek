import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/topics
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.chuDe.findMany({
      orderBy: { IdChuDe: 'desc' }
    });

    // Áp dụng kiểu map thủ công như bạn yêu cầu
    res.json(
      data.map((t) => ({
        IdChuDe: t.IdChuDe.toString(), // Chuyển BigInt -> String
        TenChuDe: t.TenChuDe,
        MoTa: t.MoTa,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

// POST /api/topics
router.post("/", async (req, res) => {
  const { TenChuDe, MoTa } = req.body;
  if (!TenChuDe) return res.status(400).json({ error: "TenChuDe is required" });

  try {
    const created = await prisma.chuDe.create({
      data: { TenChuDe, MoTa: MoTa || "" },
    });

    // Trả về object đơn lẻ cũng cần convert
    res.json({
      IdChuDe: created.IdChuDe.toString(),
      TenChuDe: created.TenChuDe,
      MoTa: created.MoTa,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create topic" });
  }
});

// PUT /api/topics/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { TenChuDe, MoTa } = req.body;

  try {
    const updated = await prisma.chuDe.update({
      where: { IdChuDe: BigInt(id) }, // Chú ý: lúc query phải ép id từ URL về BigInt
      data: {
        ...(TenChuDe && { TenChuDe }),
        ...(MoTa !== undefined && { MoTa }),
      },
    });

    // Trả về object sau khi update
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