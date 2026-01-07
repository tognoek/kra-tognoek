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

export default router;

