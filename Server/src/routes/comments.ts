import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/comments?problemId=...
router.get("/", async (req, res) => {
  const { problemId } = req.query;
  if (!problemId) return res.status(400).json({ error: "problemId is required" });
  const data = await prisma.binhLuan.findMany({
    where: { IdDeBai: BigInt(problemId as string) },
    include: { taiKhoan: true },
    orderBy: { NgayTao: "desc" },
  });
  res.json(data);
});

// POST /api/comments
router.post("/", async (req, res) => {
  const { IdDeBai, IdTaiKhoan, NoiDung } = req.body;
  if (!IdDeBai || !IdTaiKhoan || !NoiDung) return res.status(400).json({ error: "Missing fields" });
  const created = await prisma.binhLuan.create({
    data: { IdDeBai, IdTaiKhoan, NoiDung },
  });
  res.json(created);
});

export default router;

