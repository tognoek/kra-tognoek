import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/problems
router.get("/", async (_req, res) => {
  try {
    const data = await prisma.deBai.findMany({
      include: {
        taiKhoan: {
          select: {
            IdTaiKhoan: true,
            TenDangNhap: true,
            HoTen: true,
          },
        },
      },
      orderBy: { NgayTao: "desc" },
    });

    // Tránh BigInt trong JSON response
    res.json(
      data.map((p) => ({
        IdDeBai: p.IdDeBai.toString(),
        IdTaiKhoan: p.IdTaiKhoan.toString(),
        TieuDe: p.TieuDe,
        NoiDungDeBai: p.NoiDungDeBai,
        DoKho: p.DoKho,
        GioiHanThoiGian: p.GioiHanThoiGian,
        GioiHanBoNho: p.GioiHanBoNho,
        DangCongKhai: p.DangCongKhai,
        NgayTao: p.NgayTao,
        TrangThai: p.TrangThai,
        taiKhoan: p.taiKhoan
          ? {
              IdTaiKhoan: p.taiKhoan.IdTaiKhoan.toString(),
              TenDangNhap: p.taiKhoan.TenDangNhap,
              HoTen: p.taiKhoan.HoTen,
            }
          : null,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load problems" });
  }
});

// POST /api/problems
router.post("/", async (req, res) => {
  const {
    IdTaiKhoan,
    TieuDe,
    NoiDungDeBai,
    DoKho,
    GioiHanThoiGian,
    GioiHanBoNho,
    DangCongKhai,
    TrangThai,
    topicIds,
  } = req.body;

  if (!IdTaiKhoan || !TieuDe || !NoiDungDeBai || !DoKho || !GioiHanThoiGian || !GioiHanBoNho) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const created = await prisma.deBai.create({
      data: {
        IdTaiKhoan: BigInt(IdTaiKhoan),
        TieuDe,
        NoiDungDeBai,
        DoKho,
        GioiHanThoiGian,
        GioiHanBoNho,
        DangCongKhai: DangCongKhai ?? true,
        TrangThai: TrangThai ?? true,
        
        // Dùng tên trường trong model DeBai (deBaiChuDes)
        deBaiChuDes: topicIds?.length
          ? {
              create: topicIds.map((id: bigint) => ({
                IdChuDe: BigInt(id),
              })),
            }
          : undefined,
      },
    });

    res.json({
      IdDeBai: created.IdDeBai.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString(),
      TieuDe: created.TieuDe,
      NoiDungDeBai: created.NoiDungDeBai,
      DoKho: created.DoKho,
      GioiHanThoiGian: created.GioiHanThoiGian,
      GioiHanBoNho: created.GioiHanBoNho,
      DangCongKhai: created.DangCongKhai,
      TrangThai: created.TrangThai,
      NgayTao: created.NgayTao,
    });
  } catch (error: any) {
    console.error("Create problem error:", error);
    res.status(500).json({ error: "Failed to create problem" });
  }
});

// GET /api/problems/available?userId=...
router.get("/available", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const problems = await prisma.deBai.findMany({
      where: {
        IdTaiKhoan: BigInt(userId as string),
      },
      orderBy: { NgayTao: "desc" },
      select: {
        IdDeBai: true,
        TieuDe: true,
        DoKho: true,
        GioiHanThoiGian: true,
        GioiHanBoNho: true,
        DangCongKhai: true,
        TrangThai: true,
        NgayTao: true,
        IdTaiKhoan: true, 
      },
    });

    res.json(
      problems.map((p) => ({
        IdDeBai: p.IdDeBai.toString(),
        TieuDe: p.TieuDe,
        DoKho: p.DoKho,
        GioiHanThoiGian: p.GioiHanThoiGian,
        GioiHanBoNho: p.GioiHanBoNho,
        DangCongKhai: p.DangCongKhai,
        TrangThai: p.TrangThai,
        NgayTao: p.NgayTao,
        IdTaiKhoan: p.IdTaiKhoan.toString(),
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch available problems" });
  }
});

// GET /api/problems/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const problem = await prisma.deBai.findUnique({
      where: {
        IdDeBai: BigInt(id),
      },
      include: {
        taiKhoan: {
          select: {
            IdTaiKhoan: true,
            TenDangNhap: true,
            HoTen: true,
            Email: true,
          },
        },
        // Dùng tên trường quan hệ (deBaiChuDes)
        deBaiChuDes: true, 
      },
    });

    if (!problem) {
      return res.status(404).json({ error: "Bài tập không tồn tại" });
    }

    res.json({
      IdDeBai: problem.IdDeBai.toString(),
      IdTaiKhoan: problem.IdTaiKhoan.toString(),
      TieuDe: problem.TieuDe,
      NoiDungDeBai: problem.NoiDungDeBai,
      DoKho: problem.DoKho,
      GioiHanThoiGian: problem.GioiHanThoiGian,
      GioiHanBoNho: problem.GioiHanBoNho,
      DangCongKhai: problem.DangCongKhai,
      NgayTao: problem.NgayTao,
      TrangThai: problem.TrangThai,
      taiKhoan: problem.taiKhoan
        ? {
            IdTaiKhoan: problem.taiKhoan.IdTaiKhoan.toString(),
            TenDangNhap: problem.taiKhoan.TenDangNhap,
            HoTen: problem.taiKhoan.HoTen,
            Email: problem.taiKhoan.Email,
          }
        : null,
      
      // Map dữ liệu từ quan hệ deBaiChuDes
      topicIds: problem.deBaiChuDes.map((t) => Number(t.IdChuDe)),
    });
  } catch (error: any) {
    console.error("Error fetching problem:", error);

    if (error.name === "PrismaClientValidationError" || error.message.includes("BigInt")) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    res.status(500).json({ error: "Lỗi server khi lấy chi tiết bài tập" });
  }
});

// PUT /api/problems/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    TieuDe,
    NoiDungDeBai,
    DoKho,
    GioiHanThoiGian,
    GioiHanBoNho,
    DangCongKhai,
    TrangThai,
    topicIds,
  } = req.body;

  try {
    // 1. Xóa các chủ đề cũ
    // QUAN TRỌNG: Ở đây dùng tên Model (DeBai_ChuDe -> prisma.deBai_ChuDe)
    await prisma.deBai_ChuDe.deleteMany({
      where: { IdDeBai: BigInt(id) },
    });

    // 2. Cập nhật thông tin bài toán và thêm chủ đề mới
    const updated = await prisma.deBai.update({
      where: { IdDeBai: BigInt(id) },
      data: {
        TieuDe,
        NoiDungDeBai,
        DoKho,
        GioiHanThoiGian,
        GioiHanBoNho,
        DangCongKhai,
        TrangThai,
        
        // QUAN TRỌNG: Ở đây dùng tên trường quan hệ trong Model DeBai (deBaiChuDes)
        deBaiChuDes: topicIds?.length
          ? {
              create: topicIds.map((tid: number) => ({
                IdChuDe: BigInt(tid),
              })),
            }
          : undefined,
      },
    });

    res.json({ message: "Update success", IdDeBai: updated.IdDeBai.toString() });
  } catch (error: any) {
    console.error("Update problem error:", error);
    res.status(500).json({ error: "Failed to update problem" });
  }
});

export default router;