import { Router, Response } from "express";
import { prisma } from "../db";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = (req.query.q as string) || "";

    const where = searchTerm ? {
      OR: [
        { TenDangNhap: { contains: searchTerm } },
        { HoTen: { contains: searchTerm } },
        { Email: { contains: searchTerm } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.taiKhoan.findMany({
        where,
        include: { vaiTro: true },
        orderBy: { NgayTao: "desc" },
        skip,
        take: limit,
      }),
      prisma.taiKhoan.count({ where }),
    ]);

    res.json({
      users: users.map((u) => ({
        IdTaiKhoan: u.IdTaiKhoan.toString(),
        TenDangNhap: u.TenDangNhap,
        HoTen: u.HoTen,
        Email: u.Email,
        TrangThai: u.TrangThai,
        NgayTao: u.NgayTao,
        VaiTro: u.vaiTro.TenVaiTro,
      })),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/users/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { HoTen, Email, TrangThai, IdVaiTro } = req.body;

    const updated = await prisma.taiKhoan.update({
      where: { IdTaiKhoan: BigInt(id) },
      data: {
        ...(HoTen && { HoTen }),
        ...(Email && { Email }),
        ...(TrangThai !== undefined && { TrangThai }),
        ...(IdVaiTro && { IdVaiTro: BigInt(IdVaiTro) }),
      },
      include: { vaiTro: true },
    });

    res.json({
      IdTaiKhoan: updated.IdTaiKhoan.toString(),
      TenDangNhap: updated.TenDangNhap,
      HoTen: updated.HoTen,
      Email: updated.Email,
      TrangThai: updated.TrangThai,
      VaiTro: updated.vaiTro.TenVaiTro,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.taiKhoan.update({
      where: { IdTaiKhoan: BigInt(id) },
      data: { TrangThai: false },
    });

    res.json({ message: "User disabled successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/problems", async (_req: AuthRequest, res: Response) => {
  try {
    const problems = await prisma.deBai.findMany({
      include: {
        taiKhoan: {
          select: {
            TenDangNhap: true,
            HoTen: true,
          },
        },
        deBaiChuDes: {
          include: {
            chuDe: true,
          },
        },
      },
      orderBy: {
        NgayTao: "desc",
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
        Author: {
          TenDangNhap: p.taiKhoan.TenDangNhap,
          HoTen: p.taiKhoan.HoTen,
        },
        ChuDes: p.deBaiChuDes.map((dc) => dc.chuDe.TenChuDe),
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/problems/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { TrangThai, DangCongKhai } = req.body;

    const updated = await prisma.deBai.update({
      where: { IdDeBai: BigInt(id) },
      data: {
        ...(TrangThai !== undefined && { TrangThai }),
        ...(DangCongKhai !== undefined && { DangCongKhai }),
      },
    });

    res.json({
      IdDeBai: updated.IdDeBai.toString(),
      TrangThai: updated.TrangThai,
      DangCongKhai: updated.DangCongKhai,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contests", async (_req: AuthRequest, res: Response) => {
  try {
    const contests = await prisma.cuocThi.findMany({
      include: {
        taiKhoan: {
          select: {
            TenDangNhap: true,
            HoTen: true,
          },
        },
        deBais: {
          include: {
            deBai: {
              select: {
                IdDeBai: true,
                TieuDe: true,
              },
            },
          },
        },
        dangKys: true,
      },
      orderBy: {
        NgayTao: "desc",
      },
    });

    res.json(
      contests.map((c) => ({
        IdCuocThi: c.IdCuocThi.toString(),
        TenCuocThi: c.TenCuocThi,
        ThoiGianBatDau: c.ThoiGianBatDau,
        ThoiGianKetThuc: c.ThoiGianKetThuc,
        TrangThai: c.TrangThai,
        NgayTao: c.NgayTao,
        Creator: {
          TenDangNhap: c.taiKhoan.TenDangNhap,
          HoTen: c.taiKhoan.HoTen,
        },
        SoLuongBai: c.deBais.length,
        SoLuongDangKy: c.dangKys.length,
      }))
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats", async (_req: AuthRequest, res: Response) => {
  try {
    const [users, problems, contests, submissions] = await Promise.all([
      prisma.taiKhoan.count(),
      prisma.deBai.count(),
      prisma.cuocThi.count(),
      prisma.baiNop.count(),
    ]);

    res.json({
      users,
      problems,
      contests,
      submissions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

