import { Router } from "express";
import { prisma } from "../db";
import { getJobQueue } from "../redis/main";

const router = Router();

// GET /api/submissions
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;
    const { q, status, problemId, userId, contestId } = req.query;

    const where: any = {};
    if (problemId) where.IdDeBai = BigInt(problemId as string);
    if (userId) where.IdTaiKhoan = BigInt(userId as string);
    if (contestId) where.IdCuocThi = BigInt(contestId as string);

    // Lọc theo tên bài hoặc người dùng (Search)
    if (q) {
      where.OR = [
        { deBai: { TieuDe: { contains: q as string } } },
        { taiKhoan: { HoTen: { contains: q as string } } },
        { taiKhoan: { TenDangNhap: { contains: q as string } } }
      ];
    }

    // Lọc theo trạng thái (Xử lý đơn giản ở tầng DB, format chi tiết ở Map)
    if (status && status !== "all") {
        if (status === "pending") where.TrangThaiCham = null;
        // Các trạng thái khác sẽ được filter sau khi map hoặc dùng raw query nếu cần phức tạp hơn
    }

    const [data, total] = await Promise.all([
      prisma.baiNop.findMany({
        where,
        include: {
          deBai: { select: { IdDeBai: true, TieuDe: true } },
          taiKhoan: { select: { IdTaiKhoan: true, HoTen: true, TenDangNhap: true } },
          ngonNgu: { select: { IdNgonNgu: true, TenNhanDien: true } },
        },
        orderBy: { NgayNop: "desc" }, // Luôn mới nhất lên đầu
        skip,
        take: limit,
      }),
      prisma.baiNop.count({ where })
    ]);

    const formattedData = data.map((s) => {
      let trangThaiCham: string | null = s.TrangThaiCham;
      if (s.TrangThaiCham) {
        try {
          const codes = JSON.parse(s.TrangThaiCham);
          if (Array.isArray(codes) && codes.length > 0) {
            const totalTests = codes.length;
            const compileErrorIndex = codes.findIndex((c) => c === -1);
            if (compileErrorIndex !== -1) trangThaiCham = "compile_error";
            else {
              const memoryIndex = codes.findIndex((c) => c === 3);
              if (memoryIndex !== -1) trangThaiCham = `memory_limit_exceeded:${memoryIndex + 1}/${totalTests}`;
              else {
                const timeoutIndex = codes.findIndex((c) => c === 2);
                if (timeoutIndex !== -1) trangThaiCham = `time_limit_exceeded:${timeoutIndex + 1}/${totalTests}`;
                else {
                  const wrongIndex = codes.findIndex((c) => c === 1);
                  if (wrongIndex !== -1) trangThaiCham = `wrong_answer:${wrongIndex + 1}/${totalTests}`;
                  else if (codes.every((c) => c === 0)) trangThaiCham = "accepted";
                }
              }
            }
          }
        } catch (e) { console.error(e); }
      }

      return {
        ...s,
        IdBaiNop: s.IdBaiNop.toString(),
        IdTaiKhoan: s.IdTaiKhoan.toString(),
        IdDeBai: s.IdDeBai.toString(),
        TrangThaiCham: trangThaiCham,
        NgayNop: s.NgayNop,
        deBai: s.deBai ? { ...s.deBai, IdDeBai: s.deBai.IdDeBai.toString() } : null,
        taiKhoan: s.taiKhoan ? { ...s.taiKhoan, IdTaiKhoan: s.taiKhoan.IdTaiKhoan.toString() } : null,
      };
    });

    res.json({
      submissions: formattedData,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi Server" });
  }
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

  // Get test ID from BoTest và xác định inputMode
  // BoTest có DuongDanInput chứa đường dẫn đến test.zip
  // Format: http://.../data/test/{testId}/testId.zip hoặc http://.../data/test/{testId}.zip
  // Nếu DuongDanInput hoặc DuongDanOutput là null => chấm từ bàn phím (stdin)
  // Nếu cả 2 đều có giá trị => chấm từ file (file)
  let testId = IdDeBai.toString();
  let inputMode = "stdin"; // Default to stdin
  
  if (problem.boTests.length > 0) {
    const boTest = problem.boTests[0];
    testId = boTest.IdBoTest.toString();
    const testInputPath = boTest.DuongDanInput;
    const testOutputPath = boTest.DuongDanOutput;
    
    if (testInputPath && testOutputPath) {
      inputMode = "file";
    } else {
      inputMode = "stdin";
    }
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
        memoryLimitKb: problem.GioiHanBoNho * 1024,
        inputMode: inputMode, // "stdin" nếu DuongDanInput/Output null, "file" nếu có cả 2
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
  
  // TrangThaiCham: null = đang chấm, JSON string của mảng codes = "[0,0,1,2,0]"
  // Parse và format lại cho frontend
  let trangThaiCham: string | null = submission.TrangThaiCham;
  let ketQuaCham: number[] | null = null;

  if (submission.TrangThaiCham) {
    try {
      ketQuaCham = JSON.parse(submission.TrangThaiCham);
      if (Array.isArray(ketQuaCham) && ketQuaCham.length > 0) {
        const codes = ketQuaCham;
        const totalTests = codes.length;

        // Kiểm tra lỗi biên dịch (code -1)
        const compileErrorIndex = codes.findIndex((code) => code === -1);
        if (compileErrorIndex !== -1) {
          trangThaiCham = "compile_error";
        } else {
          // Kiểm tra memory limit exceeded (code 3)
          const memoryLimitIndex = codes.findIndex((code) => code === 3);
          if (memoryLimitIndex !== -1) {
            trangThaiCham = `memory_limit_exceeded:${memoryLimitIndex + 1}/${totalTests}`;
          } else {
            // Kiểm tra timeout (code 2)
            const timeoutIndex = codes.findIndex((code) => code === 2);
            if (timeoutIndex !== -1) {
              trangThaiCham = `time_limit_exceeded:${timeoutIndex + 1}/${totalTests}`;
            } else {
              // Kiểm tra wrong answer (code 1)
              const wrongIndex = codes.findIndex((code) => code === 1);
              if (wrongIndex !== -1) {
                trangThaiCham = `wrong_answer:${wrongIndex + 1}/${totalTests}`;
              } else {
                // Tất cả đều đúng (code 0)
                const allPass = codes.every((code) => code === 0);
                if (allPass) {
                  trangThaiCham = "accepted";
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Parse TrangThaiCham error:", e);
      // Giữ nguyên giá trị nếu parse lỗi
    }
  }

  res.json({
    IdBaiNop: submission.IdBaiNop.toString(),
    IdTaiKhoan: submission.IdTaiKhoan.toString(),
    IdDeBai: submission.IdDeBai.toString(),
    IdNgonNgu: submission.IdNgonNgu.toString(),
    IdCuocThi: submission.IdCuocThi ? submission.IdCuocThi.toString() : null,
    DuongDanCode: submission.DuongDanCode,
    TrangThaiCham: trangThaiCham, // null = đang chấm, hoặc formatted string
    KetQuaCham: ketQuaCham, // Mảng codes gốc để frontend có thể dùng
    ThoiGianThucThi: submission.ThoiGianThucThi,
    BoNhoSuDung: submission.BoNhoSuDung,
    NgayNop: submission.NgayNop,
  });
});

// Callback from worker: POST /api/submissions/:id/callback
router.post("/:id/callback", async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const {
      ThoiGianThucThi,
      BoNhoSuDung,
      compileError,
      TrangThaiCham,  // Mảng codes từ Kra: [-1] hoặc [0,0,1,2,0] - -1=compile error, 0=đúng, 1=sai, 2=timeout, 3=memory limit
    } = req.body;

    // Lưu mảng codes vào TrangThaiCham dưới dạng JSON string
    // null = đang chấm
    // JSON string của mảng codes = kết quả chấm: "[-1]" hoặc "[0,0,1,2,0]"
    let statusMessage: string | null = null;

    if (TrangThaiCham && Array.isArray(TrangThaiCham)) {
      // Lưu mảng codes dưới dạng JSON string
      statusMessage = JSON.stringify(TrangThaiCham);
    } else if (compileError) {
      // Nếu có compileError nhưng không có TrangThaiCham, tạo mảng [-1]
      statusMessage = JSON.stringify([-1]);
    }

    const updated = await prisma.baiNop.update({
      where: { IdBaiNop: id },
      data: {
        TrangThaiCham: statusMessage,
        ThoiGianThucThi: ThoiGianThucThi ?? null,
        BoNhoSuDung: BoNhoSuDung ?? null,
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

