import { Router } from "express";
import { prisma } from "../db";

import { getAvatarUrl } from "../scripts/avatar";

const router = Router();

router.get("/", async (_req, res) => {
  const data = await prisma.taiKhoan.findMany({
    include: { vaiTro: true },
  });
  res.json(data);
});

router.get("/:id", async (req, res) => {
  try {
    const userId = BigInt(req.params.id);

    const user = await prisma.taiKhoan.findUnique({
      where: { IdTaiKhoan: userId },
      include: {
        vaiTro: {
          select: { TenVaiTro: true },
        },
        dangKys: {
          where: { TrangThai: true },
          include: {
            cuocThi: {
              select: {
                IdCuocThi: true,
                TenCuocThi: true,
                ThoiGianBatDau: true,
                ThoiGianKetThuc: true,
              }
            }
          }
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

    const allSubmissions = await prisma.baiNop.findMany({
      where: { IdTaiKhoan: userId, TrangThaiCham: { not: null } },
      select: { TrangThaiCham: true },
    });

    let successfulSubmissions = 0;
    for (const submission of allSubmissions) {
      try {
        const codes = JSON.parse(submission.TrangThaiCham!);
        if (Array.isArray(codes) && codes.length > 0 && codes.every((code) => code === 0)) {
          successfulSubmissions++;
        }
      } catch (e) {}
    }

    const participatedContestsData = await Promise.all(
      user.dangKys.map(async (dk) => {
        const contestStats = await prisma.baiNop.findMany({
          where: {
            IdTaiKhoan: userId,
            IdCuocThi: dk.IdCuocThi
          },
          select: { TrangThaiCham: true }
        });

        const totalInContest = contestStats.length;
        const acInContest = contestStats.filter(s => {
          try {
            const codes = JSON.parse(s.TrangThaiCham!);
            return Array.isArray(codes) && codes.every(c => c === 0);
          } catch { return false; }
        }).length;

        return {
          IdCuocThi: dk.cuocThi.IdCuocThi.toString(),
          TenCuocThi: dk.cuocThi.TenCuocThi,
          ThoiGianBatDau: dk.cuocThi.ThoiGianBatDau,
          ThoiGianKetThuc: dk.cuocThi.ThoiGianKetThuc,
          stats: {
            totalSubmissions: totalInContest,
            solvedProblems: acInContest
          }
        };
      })
    );

    res.json({
      IdTaiKhoan: user.IdTaiKhoan.toString(),
      TenDangNhap: user.TenDangNhap,
      HoTen: user.HoTen,
      Email: user.Email,
      Avatar: getAvatarUrl(user.Email),
      TrangThai: user.TrangThai,
      NgayTao: user.NgayTao,
      VaiTro: user.vaiTro.TenVaiTro,
      participatedContests: participatedContestsData, 
      stats: {
        totalProblems: user._count.deBais,
        totalSubmissions: user._count.baiNops,
        successfulSubmissions: successfulSubmissions,
        totalContests: user._count.cuocThis,
        participatedContestsCount: user.dangKys.length,
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy thông tin người dùng" });
  }
});

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

