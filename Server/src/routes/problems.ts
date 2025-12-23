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
    TestPath,
  } = req.body;

  if (!IdTaiKhoan || !TieuDe || !NoiDungDeBai || !DoKho || !GioiHanThoiGian || !GioiHanBoNho) {
    return res.status(400).json({ error: "Missing required fields" });
  }

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
      deBaiChuDes: topicIds?.length
        ? {
            create: topicIds.map((id: bigint) => ({
              IdChuDe: BigInt(id),
            })),
          }
        : undefined,
      boTests: TestPath
        ? {
            create: {
              DuongDanInput: TestPath,
              DuongDanOutput: "",
              DuongDanCode: "",
            },
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
    });
  } catch (error: any) {
    console.error("Error fetching problem:", error);
    
    if (error.name === 'PrismaClientValidationError' || error.message.includes('BigInt')) {
         return res.status(400).json({ error: "ID không hợp lệ" });
    }

    res.status(500).json({ error: "Lỗi server khi lấy chi tiết bài tập" });
  }
});

export default router;

