import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/users
router.get("/", async (_req, res) => {
  const data = await prisma.taiKhoan.findMany({
    include: { vaiTro: true },
  });
  res.json(data);
});

// GET /api/users/:id - Lấy thông tin user theo ID
router.get("/:id", async (req, res) => {
  try {
    const userId = BigInt(req.params.id);

    const user = await prisma.taiKhoan.findUnique({
      where: { IdTaiKhoan: userId },
      include: {
        vaiTro: {
          select: {
            TenVaiTro: true,
          },
        },
        _count: {
          select: {
            deBais: true,
            baiNops: true,
            cuocThis: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // Đếm số bài nộp thành công
    // TrangThaiCham trong database là JSON string của mảng codes: "[0,0,0,0]" (tất cả đều 0 = accepted)
    // Hoặc có thể là string "accepted" hoặc "hoan_tat" (từ hệ thống cũ)
    const allSubmissions = await prisma.baiNop.findMany({
      where: {
        IdTaiKhoan: userId,
        TrangThaiCham: {
          not: null,
        },
      },
      select: {
        TrangThaiCham: true,
      },
    });

    let successfulSubmissions = 0;
    for (const submission of allSubmissions) {
      if (!submission.TrangThaiCham) continue;
      
      // Kiểm tra nếu là string "accepted" hoặc "hoan_tat" (từ hệ thống cũ)
      if (submission.TrangThaiCham === "accepted" || submission.TrangThaiCham === "hoan_tat") {
        successfulSubmissions++;
        continue;
      }

      // Parse JSON string thành mảng codes
      try {
        const codes = JSON.parse(submission.TrangThaiCham);
        if (Array.isArray(codes) && codes.length > 0) {
          // Kiểm tra xem tất cả codes có phải là 0 không (accepted)
          // Code 0 = đúng, code -1 = compile error, code 1 = wrong answer, code 2 = timeout, code 3 = memory limit
          const allPass = codes.every((code) => code === 0);
          if (allPass) {
            successfulSubmissions++;
          }
        }
      } catch (e) {
        // Nếu không parse được, bỏ qua
        console.warn("Failed to parse TrangThaiCham:", submission.TrangThaiCham);
      }
    }

    // Đếm số cuộc thi đã tham gia (đã đăng ký)
    const participatedContests = await prisma.cuocThi_DangKy.count({
      where: {
        IdTaiKhoan: userId,
      },
    });

    res.json({
      IdTaiKhoan: user.IdTaiKhoan.toString(),
      TenDangNhap: user.TenDangNhap,
      HoTen: user.HoTen,
      Email: user.Email,
      TrangThai: user.TrangThai,
      NgayTao: user.NgayTao,
      VaiTro: user.vaiTro.TenVaiTro,
      stats: {
        totalProblems: user._count.deBais,
        totalSubmissions: user._count.baiNops,
        successfulSubmissions: successfulSubmissions,
        totalContests: user._count.cuocThis,
        participatedContests: participatedContests,
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    if (error.name === "PrismaClientValidationError" || error.message?.includes("BigInt")) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    res.status(500).json({ error: error.message || "Lỗi server khi lấy thông tin người dùng" });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  const { IdVaiTro, TenDangNhap, MatKhau, HoTen, Email } = req.body;
  if (!IdVaiTro || !TenDangNhap || !MatKhau || !HoTen || !Email) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const created = await prisma.taiKhoan.create({
    data: { IdVaiTro, TenDangNhap, MatKhau, HoTen, Email },
  });
  res.json(created);
});

// PUT /api/users/:id - Cập nhật thông tin user
router.put("/:id", async (req, res) => {
  try {
    const userId = BigInt(req.params.id);
    const { HoTen } = req.body;

    if (!HoTen || typeof HoTen !== "string" || HoTen.trim().length === 0) {
      return res.status(400).json({ error: "Họ tên không được để trống" });
    }

    if (HoTen.trim().length < 2) {
      return res.status(400).json({ error: "Họ tên phải có ít nhất 2 ký tự" });
    }

    const updated = await prisma.taiKhoan.update({
      where: { IdTaiKhoan: userId },
      data: { HoTen: HoTen.trim() },
      select: {
        IdTaiKhoan: true,
        TenDangNhap: true,
        HoTen: true,
        Email: true,
        TrangThai: true,
        NgayTao: true,
      },
    });

    res.json({
      IdTaiKhoan: updated.IdTaiKhoan.toString(),
      TenDangNhap: updated.TenDangNhap,
      HoTen: updated.HoTen,
      Email: updated.Email,
      TrangThai: updated.TrangThai,
      NgayTao: updated.NgayTao,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    if (error.name === "PrismaClientValidationError" || error.message?.includes("BigInt")) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    res.status(500).json({ error: error.message || "Lỗi server khi cập nhật thông tin" });
  }
});

export default router;

