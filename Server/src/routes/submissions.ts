import { Router } from "express";
import { prisma } from "../db";
import { getJobQueue } from "../redis/main";

const router = Router();

// GET /api/submissions
router.get("/", async (req, res) => {
  const { status, problemId, userId, contestId } = req.query;
  const where: any = {};
  
  if (status) where.TrangThaiCham = status;
  if (problemId) where.IdDeBai = BigInt(problemId as string);
  if (userId) where.IdTaiKhoan = BigInt(userId as string);
  if (contestId) where.IdCuocThi = BigInt(contestId as string);

  const data = await prisma.baiNop.findMany({
    where,
    include: {
      deBai: { select: { IdDeBai: true, TieuDe: true } },
      taiKhoan: { select: { IdTaiKhoan: true, TenDangNhap: true } },
      ngonNgu: { select: { IdNgonNgu: true, TenNhanDien: true } },
    },
    orderBy: { NgayNop: "desc" },
    take: 100,
  });
  res.json(
    data.map((s) => ({
      IdBaiNop: s.IdBaiNop.toString(),
      IdTaiKhoan: s.IdTaiKhoan.toString(),
      IdDeBai: s.IdDeBai.toString(),
      IdNgonNgu: s.IdNgonNgu.toString(),
      IdCuocThi: s.IdCuocThi ? s.IdCuocThi.toString() : null,
      DuongDanCode: s.DuongDanCode,
      TrangThaiCham: s.TrangThaiCham,
      ThoiGianThucThi: s.ThoiGianThucThi,
      BoNhoSuDung: s.BoNhoSuDung,
      NgayNop: s.NgayNop,
      deBai: s.deBai
        ? {
            IdDeBai: s.deBai.IdDeBai.toString(),
            TieuDe: s.deBai.TieuDe,
          }
        : null,
      taiKhoan: s.taiKhoan
        ? {
            IdTaiKhoan: s.taiKhoan.IdTaiKhoan.toString(),
            TenDangNhap: s.taiKhoan.TenDangNhap,
          }
        : null,
      ngonNgu: s.ngonNgu
        ? {
            IdNgonNgu: s.ngonNgu.IdNgonNgu.toString(),
            TenNhanDien: s.ngonNgu.TenNhanDien,
          }
        : null,
    }))
  );
});

// POST /api/submissions
router.post("/", async (req, res) => {
  const { IdTaiKhoan, IdDeBai, IdNgonNgu, IdCuocThi, DuongDanCode } = req.body;
  if (!IdTaiKhoan || !IdDeBai || !IdNgonNgu || !DuongDanCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const submission = await prisma.baiNop.create({
    data: {
      IdTaiKhoan,
      IdDeBai,
      IdNgonNgu,
      IdCuocThi: IdCuocThi ?? null,
      DuongDanCode,
      TrangThaiCham: "pending",
    },
  });

  // Push job to Redis queue for Kra worker
  try {
    const jobQueue = getJobQueue();
    await jobQueue.addJob({
      task: "judge",
      data: {
        submissionId: submission.IdBaiNop.toString(),
        problemId: IdDeBai.toString(),
        codePath: DuongDanCode,
        // Suy đoán ngôn ngữ từ đường dẫn hoặc IdNgonNgu (tạm thời: theo đuôi file)
        language: typeof DuongDanCode === "string" && DuongDanCode.toLowerCase().endsWith(".c")
          ? "c"
          : "cpp",
      },
    });
  } catch (err) {
    console.error("Queue error:", err);
  }

  res.json(submission);
});

// GET /api/submissions/:id
router.get("/:id", async (req, res) => {
  const id = BigInt(req.params.id);
  const submission = await prisma.baiNop.findUnique({
    where: { IdBaiNop: id },
  });
  if (!submission) return res.status(404).json({ error: "Not found" });
  res.json(submission);
});

// Callback from worker: POST /api/submissions/:id/callback
router.post("/:id/callback", async (req, res) => {
  const id = BigInt(req.params.id);
  const { TrangThaiCham, ThoiGianThucThi, BoNhoSuDung } = req.body;
  const updated = await prisma.baiNop.update({
    where: { IdBaiNop: id },
    data: {
      TrangThaiCham,
      ThoiGianThucThi,
      BoNhoSuDung,
    },
  });
  res.json(updated);
});

export default router;

