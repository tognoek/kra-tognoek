import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/contests/by-user/:userId - Lấy danh sách cuộc thi do user cụ thể tạo (Dùng cho trang quản lý)
router.get("/by-user/:userId", async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);

    const data = await prisma.cuocThi.findMany({
      where: { 
        IdTaiKhoan: userId // Chỉ lấy cuộc thi của user này
      },
      include: {
        deBais: { include: { deBai: true } },
        taiKhoan: { select: { TenDangNhap: true } }, // Lấy tên người tạo
        _count: {
          select: {
            dangKys: true,
            baiNops: true,
          },
        },
      },
      orderBy: { NgayTao: "desc" },
    });

    // Map dữ liệu trả về giống hệt cấu trúc cũ để Frontend không bị lỗi
    res.json(
      data.map((c) => ({
        IdCuocThi: c.IdCuocThi.toString(),
        IdTaiKhoan: c.IdTaiKhoan.toString(),
        TenCuocThi: c.TenCuocThi,
        MoTa: c.MoTa,
        ThoiGianBatDau: c.ThoiGianBatDau,
        ThoiGianKetThuc: c.ThoiGianKetThuc,
        TrangThai: c.TrangThai,
        NgayTao: c.NgayTao,
        ChuY: c.ChuY,
        taiKhoan: c.taiKhoan, // Trả về thông tin người tạo
        _count: c._count,     // Trả về số lượng đk/bài nộp
        stats: {              // Helper stats cho frontend dễ dùng
           totalRegistrations: c._count.dangKys
        },
        deBais: c.deBais.map((d) => ({
          IdCuocThi: d.IdCuocThi.toString(),
          IdDeBai: d.IdDeBai.toString(),
          TenHienThi: d.TenHienThi,
          deBai: d.deBai
            ? {
                IdDeBai: d.deBai.IdDeBai.toString(),
                TieuDe: d.deBai.TieuDe,
              }
            : null,
        })),
      }))
    );
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi tải danh sách cuộc thi của người dùng" });
  }
});

// GET /api/contests - Lấy danh sách cuộc thi
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.cuocThi.findMany({
      include: {
        deBais: { include: { deBai: true } },
      },
      orderBy: { NgayTao: "desc" },
    });

    res.json(
      data.map((c) => ({
        IdCuocThi: c.IdCuocThi.toString(),
        IdTaiKhoan: c.IdTaiKhoan.toString(),
        TenCuocThi: c.TenCuocThi,
        MoTa: c.MoTa,
        ThoiGianBatDau: c.ThoiGianBatDau,
        ThoiGianKetThuc: c.ThoiGianKetThuc,
        TrangThai: c.TrangThai,
        NgayTao: c.NgayTao,
        ChuY: c.ChuY,
        deBais: c.deBais.map((d) => ({
          IdCuocThi: d.IdCuocThi.toString(),
          IdDeBai: d.IdDeBai.toString(),
          TenHienThi: d.TenHienThi,
          deBai: d.deBai
            ? {
                IdDeBai: d.deBai.IdDeBai.toString(),
                TieuDe: d.deBai.TieuDe,
              }
            : null,
        })),
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load contests" });
  }
});

// POST /api/contests - Tạo cuộc thi mới
router.post("/", async (req, res) => {
  const {
    IdTaiKhoan,
    TenCuocThi,
    MoTa,
    ThoiGianBatDau,
    ThoiGianKetThuc,
    TrangThai = true,
    ChuY,
    problems,
  } = req.body;

  if (!IdTaiKhoan || !TenCuocThi || !MoTa || !ThoiGianBatDau || !ThoiGianKetThuc) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const created = await prisma.cuocThi.create({
    data: {
      IdTaiKhoan,
      TenCuocThi,
      MoTa,
      ThoiGianBatDau: new Date(ThoiGianBatDau),
      ThoiGianKetThuc: new Date(ThoiGianKetThuc),
      TrangThai,
      ChuY,
      deBais: problems?.length
        ? { create: problems.map((p: any) => ({ IdDeBai: BigInt(p.IdDeBai), TenHienThi: p.TenHienThi })) }
        : undefined,
    },
  });
  
  // Trả về JSON, xử lý BigInt bằng cách convert sang string (nếu chưa cấu hình global)
  res.json({
      ...created,
      IdCuocThi: created.IdCuocThi.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString()
  });
});

// PUT /api/contests/:id - Cập nhật thông tin chung cuộc thi
router.put("/:id", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { TenCuocThi, MoTa, ChuY, ThoiGianBatDau, ThoiGianKetThuc, TrangThai } = req.body;

  try {
    const updated = await prisma.cuocThi.update({
      where: { IdCuocThi: contestId },
      data: {
        TenCuocThi,
        MoTa,
        ChuY,
        ThoiGianBatDau: new Date(ThoiGianBatDau),
        ThoiGianKetThuc: new Date(ThoiGianKetThuc),
        TrangThai,
      },
    });
    res.json({ ...updated, IdCuocThi: updated.IdCuocThi.toString(), IdTaiKhoan: updated.IdTaiKhoan.toString() });
  } catch (error: any) {
    res.status(500).json({ error: "Lỗi cập nhật cuộc thi" });
  }
});

// ==================================================================
// 1. [SỬA] POST: Thêm bài (hoặc Khôi phục bài ẩn)
// Quan trọng: Phải trả về thông tin bài gốc (TieuDe) để FE hiển thị
// ==================================================================
router.post("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai, TenHienThi } = req.body;

  try {
    // Dùng upsert: Nếu có rồi thì update (khôi phục), chưa có thì create
    const result = await prisma.cuocThi_DeBai.upsert({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      update: {
        TrangThai: true, // Khôi phục trạng thái về 1 (Hiện)
        TenHienThi: TenHienThi // Cập nhật tên nếu có gửi lên
      },
      create: {
        IdCuocThi: contestId,
        IdDeBai: BigInt(IdDeBai),
        TenHienThi: TenHienThi || "",
        TrangThai: true // Tạo mới trạng thái là 1
      },
      // QUAN TRỌNG: Include deBai để lấy TieuDe trả về cho Frontend
      include: {
        deBai: {
          select: { TieuDe: true, DoKho: true }
        }
      }
    });

    res.json({
        ...result,
        IdCuocThi: result.IdCuocThi.toString(),
        IdDeBai: result.IdDeBai.toString(),
        // Prisma đã include deBai vào result rồi
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi thêm bài vào cuộc thi" });
  }
});

// ==================================================================
// 2. [THÊM MỚI] DELETE: Xóa mềm (Đưa trạng thái về 0)
// API này chưa có trong code cũ của bạn
// ==================================================================
router.delete("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai } = req.body;

  try {
    // Không xóa dòng dữ liệu, chỉ update TrangThai = false
    await prisma.cuocThi_DeBai.update({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      data: {
        TrangThai: false, // 0 = Ẩn/Xóa mềm
      },
    });

    res.json({ success: true, message: "Đã ẩn bài khỏi cuộc thi" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa bài" });
  }
});

// ==================================================================
// 3. [GIỮ NGUYÊN] PUT: Sửa tên hiển thị hoặc cập nhật trạng thái thủ công
// ==================================================================
router.put("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai, TrangThai, TenHienThi } = req.body; 

  try {
    const dataToUpdate: any = {};
    if (TrangThai !== undefined) dataToUpdate.TrangThai = TrangThai;
    if (TenHienThi !== undefined) dataToUpdate.TenHienThi = TenHienThi;

    await prisma.cuocThi_DeBai.update({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      data: dataToUpdate,
    });

    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi cập nhật bài thi" });
  }
});

// PUT /api/contests/:id/kick - Hủy đăng ký (Kick) thí sinh
router.put("/:id/kick", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdTaiKhoan } = req.body; 

  try {
    const updated = await prisma.cuocThi_DangKy.update({
      where: {
        IdCuocThi_IdTaiKhoan: {
          IdCuocThi: contestId,
          IdTaiKhoan: BigInt(IdTaiKhoan),
        },
      },
      data: {
        TrangThai: false, 
      },
    });
    res.json({ success: true, message: "Đã hủy tư cách thi của thí sinh" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi hủy thí sinh" });
  }
});

// GET /api/contests/:id - Lấy chi tiết cuộc thi
router.get("/:id", async (req, res) => {
  try {
    const contestId = BigInt(req.params.id);

    const contest = await prisma.cuocThi.findUnique({
      where: { IdCuocThi: contestId },
      include: {
        taiKhoan: {
          select: {
            IdTaiKhoan: true,
            TenDangNhap: true,
            HoTen: true,
            Email: true,
          },
        },
        deBais: {
          include: {
            deBai: {
              select: {
                IdDeBai: true,
                TieuDe: true,
                DoKho: true,
                GioiHanThoiGian: true,
                GioiHanBoNho: true,
              },
            },
          },
          orderBy: {
            IdDeBai: "asc",
          },
        },
        dangKys: {
          include: {
            taiKhoan: {
              select: {
                IdTaiKhoan: true,
                TenDangNhap: true,
                HoTen: true,
              },
            },
          },
        },
        _count: {
          select: {
            baiNops: true,
            dangKys: true,
          },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: "Cuộc thi không tồn tại" });
    }

    // Tính trạng thái cuộc thi
    const now = new Date();
    const start = new Date(contest.ThoiGianBatDau);
    const end = new Date(contest.ThoiGianKetThuc);
    
    let status = "Finished";
    if (!contest.TrangThai) {
      status = "Closed";
    } else if (now < start) {
      status = "Upcoming";
    } else if (now >= start && now <= end) {
      status = "Running";
    }

    res.json({
      IdCuocThi: contest.IdCuocThi.toString(),
      IdTaiKhoan: contest.IdTaiKhoan.toString(),
      TenCuocThi: contest.TenCuocThi,
      MoTa: contest.MoTa,
      ThoiGianBatDau: contest.ThoiGianBatDau,
      ThoiGianKetThuc: contest.ThoiGianKetThuc,
      TrangThai: contest.TrangThai,
      NgayTao: contest.NgayTao,
      ChuY: contest.ChuY,
      Status: status,
      taiKhoan: {
        IdTaiKhoan: contest.taiKhoan.IdTaiKhoan.toString(),
        TenDangNhap: contest.taiKhoan.TenDangNhap,
        HoTen: contest.taiKhoan.HoTen,
        Email: contest.taiKhoan.Email,
      },
      deBais: contest.deBais.map((d) => ({
        IdCuocThi: d.IdCuocThi.toString(),
        IdDeBai: d.IdDeBai.toString(),
        TenHienThi: d.TenHienThi,
        TrangThai: d.TrangThai,
        deBai: d.deBai
          ? {
              IdDeBai: d.deBai.IdDeBai.toString(),
              TieuDe: d.deBai.TieuDe,
              DoKho: d.deBai.DoKho,
              GioiHanThoiGian: d.deBai.GioiHanThoiGian,
              GioiHanBoNho: d.deBai.GioiHanBoNho,
            }
          : null,
      })),
      dangKys: contest.dangKys.map((d) => ({
        IdCuocThi: d.IdCuocThi.toString(),
        IdTaiKhoan: d.IdTaiKhoan.toString(),
        TrangThai: d.TrangThai,
        taiKhoan: {
          IdTaiKhoan: d.taiKhoan.IdTaiKhoan.toString(),
          TenDangNhap: d.taiKhoan.TenDangNhap,
          HoTen: d.taiKhoan.HoTen,
        },
      })),
      stats: {
        totalProblems: contest.deBais.length,
        totalRegistrations: contest._count.dangKys,
        totalSubmissions: contest._count.baiNops,
      },
    });
  } catch (error: any) {
    console.error("Get contest detail error:", error);
    if (error.name === "PrismaClientValidationError" || error.message?.includes("BigInt")) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    res.status(500).json({ error: error.message || "Lỗi server khi lấy chi tiết cuộc thi" });
  }
});

// POST /api/contests/:id/register
router.post("/:id/register", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdTaiKhoan } = req.body;
  if (!IdTaiKhoan) return res.status(400).json({ error: "IdTaiKhoan required" });
  const created = await prisma.cuocThi_DangKy.create({
    data: { IdCuocThi: contestId, IdTaiKhoan },
  });
  // Convert BigInt for register response
  res.json({
      ...created,
      IdCuocThi: created.IdCuocThi.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString()
  });
});

export default router;