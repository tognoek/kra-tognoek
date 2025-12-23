import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/contests
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

// POST /api/contests
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
  res.json(created);
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
  res.json(created);
});

export default router;

