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

  // Lấy thông tin problem và test
  const problem = await prisma.deBai.findUnique({
    where: { IdDeBai: BigInt(IdDeBai) },
    include: {
      boTests: {
        take: 1,
        orderBy: { NgayTao: "desc" },
      },
    },
  });

  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }

  // Lấy ngôn ngữ
  const language = await prisma.ngonNgu.findUnique({
    where: { IdNgonNgu: BigInt(IdNgonNgu) },
  });

  if (!language) {
    return res.status(404).json({ error: "Language not found" });
  }

  // Extract code ID from URL (format: http://.../data/code/{codeId}.cpp)
  // Hoặc từ filename: username_timestamp
  const codeIdMatch = typeof DuongDanCode === "string" ? DuongDanCode.match(/\/([^\/]+)\.(cpp|c)$/) : null;
  const codeId = codeIdMatch ? codeIdMatch[1] : `code_${Date.now()}`;

  // Get test ID from BoTest
  // BoTest có DuongDanInput chứa đường dẫn đến test.zip
  // Format: http://.../data/test/{testId}/testId.zip hoặc http://.../data/test/{testId}.zip
  let testId = IdDeBai.toString();
  if (problem.boTests.length > 0) {
    const testPath = problem.boTests[0].DuongDanInput || "";
    if (typeof testPath === "string") {
      // Thử extract test ID từ path: /data/test/{testId}/... hoặc /data/test/{testId}.zip
      const testMatch1 = testPath.match(/\/test\/([^\/]+)\//);
      const testMatch2 = testPath.match(/\/test\/([^\/]+)\.zip$/);
      if (testMatch1) {
        testId = testMatch1[1];
      } else if (testMatch2) {
        testId = testMatch2[1];
      }
    }
    // Nếu không match, dùng problem ID
  }

  const submission = await prisma.baiNop.create({
    data: {
      IdTaiKhoan: BigInt(IdTaiKhoan),
      IdDeBai: BigInt(IdDeBai),
      IdNgonNgu: BigInt(IdNgonNgu),
      IdCuocThi: IdCuocThi ? BigInt(IdCuocThi) : null,
      DuongDanCode,
      TrangThaiCham: null, // null = đang chấm
    },
  });

  // Push job to Redis queue for Kra worker
  try {
    const jobQueue = getJobQueue();
    const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:5000";
    
    await jobQueue.addJob({
      task: "judge",
      data: {
        submissionId: submission.IdBaiNop.toString(),
        problemId: IdDeBai.toString(),
        codeId: codeId,
        testId: testId,
        timeLimitMs: problem.GioiHanThoiGian,
        memoryLimitKb: problem.GioiHanBoNho,
        inputMode: "stdin", // Default to stdin
        language: language.TenNhanDien.toLowerCase(),
        serverBaseUrl: SERVER_BASE_URL,
      },
    });
  } catch (err) {
    console.error("Queue error:", err);
    // Still return submission even if queue fails
  }

  res.json({
    IdBaiNop: submission.IdBaiNop.toString(),
    IdTaiKhoan: submission.IdTaiKhoan.toString(),
    IdDeBai: submission.IdDeBai.toString(),
    IdNgonNgu: submission.IdNgonNgu.toString(),
    IdCuocThi: submission.IdCuocThi ? submission.IdCuocThi.toString() : null,
    DuongDanCode: submission.DuongDanCode,
    TrangThaiCham: submission.TrangThaiCham,
    ThoiGianThucThi: submission.ThoiGianThucThi,
    BoNhoSuDung: submission.BoNhoSuDung,
    NgayNop: submission.NgayNop,
  });
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
  try {
    const id = BigInt(req.params.id);
    const {
      TrangThaiCham,
      ThoiGianThucThi,
      BoNhoSuDung,
      compileError,
      failedTestIndex,
      totalTests,
    } = req.body;

    // Build status message based on result
    let statusMessage = TrangThaiCham;
    
    if (compileError) {
      statusMessage = `compile_error:${compileError}`;
    } else if (TrangThaiCham === "accepted") {
      statusMessage = "accepted";
    } else if (failedTestIndex !== undefined && totalTests !== undefined) {
      statusMessage = `wrong_answer:${failedTestIndex + 1}/${totalTests}`;
    } else if (TrangThaiCham) {
      statusMessage = TrangThaiCham;
    }

    const updated = await prisma.baiNop.update({
      where: { IdBaiNop: id },
      data: {
        TrangThaiCham: statusMessage,
        ThoiGianThucThi: ThoiGianThucThi || null,
        BoNhoSuDung: BoNhoSuDung || null,
      },
    });

    res.json({
      IdBaiNop: updated.IdBaiNop.toString(),
      TrangThaiCham: updated.TrangThaiCham,
      ThoiGianThucThi: updated.ThoiGianThucThi,
      BoNhoSuDung: updated.BoNhoSuDung,
    });
  } catch (error: any) {
    console.error("Callback error:", error);
    res.status(500).json({ error: error.message || "Failed to update submission" });
  }
});

// GET /api/submissions/stats/:userId - Thống kê submissions theo ngày
router.get("/stats/:userId", async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);
    const { groupBy = "day" } = req.query; // day, month, year

    // Lấy tất cả submissions của user
    const submissions = await prisma.baiNop.findMany({
      where: { IdTaiKhoan: userId },
      select: { NgayNop: true },
      orderBy: { NgayNop: "asc" },
    });

    // Nhóm theo ngày/tháng/năm
    const statsMap = new Map<string, number>();

    submissions.forEach((sub) => {
      const date = new Date(sub.NgayNop);
      let key: string;

      if (groupBy === "year") {
        key = date.getFullYear().toString();
      } else if (groupBy === "month") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        // day
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }

      statsMap.set(key, (statsMap.get(key) || 0) + 1);
    });

    // Chuyển thành array và sắp xếp
    const stats = Array.from(statsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(stats);
  } catch (error: any) {
    console.error("Stats error:", error);
    res.status(500).json({ error: error.message || "Failed to get stats" });
  }
});

export default router;

