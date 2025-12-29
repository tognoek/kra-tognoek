import { Router } from "express";
import { prisma } from "../db";

import { getAvatarUrl } from "../scripts/avatar";

const router = Router();

router.get("/by-user/:userId", async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);

    const data = await prisma.cuocThi.findMany({
      where: { 
        IdTaiKhoan: userId
      },
      include: {
        deBais: { include: { deBai: true } },
        taiKhoan: { select: { TenDangNhap: true } }, 
        _count: {
          select: {
            dangKys: true,
            baiNops: true,
          },
        },
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
        taiKhoan: c.taiKhoan,
        _count: c._count,
        stats: {
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

router.get("/contests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.creatorId;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID cuộc thi không hợp lệ" });
    }

    const contest = await prisma.cuocThi.findUnique({
      where: { IdCuocThi: BigInt(id) },
      include: {
        deBais: {
          include: { deBai: true },
          orderBy: { IdDeBai: "asc" },
        },
        dangKys: {
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
        },
      },
    });

    if (!contest)
      return res.status(404).json({ error: "Cuộc thi không tồn tại" });

    if (userId && contest.IdTaiKhoan.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền quản lý cuộc thi này" });
    }

    res.json({
      ...contest,
      IdCuocThi: contest.IdCuocThi.toString(),
      IdTaiKhoan: contest.IdTaiKhoan.toString(),
      deBais: contest.deBais.map((d) => ({
        ...d,
        IdCuocThi: d.IdCuocThi.toString(),
        IdDeBai: d.IdDeBai.toString(),
        deBai: d.deBai
          ? { ...d.deBai, IdDeBai: d.deBai.IdDeBai.toString() }
          : null,
      })),
      dangKys: contest.dangKys.map((dk) => ({
        ...dk,
        IdCuocThi: dk.IdCuocThi.toString(),
        IdTaiKhoan: dk.IdTaiKhoan.toString(),
        taiKhoan: {
          IdTaiKhoan: dk.taiKhoan.IdTaiKhoan.toString(),
          Avatar: getAvatarUrl(dk.taiKhoan.Email),
          HoTen: dk.taiKhoan.HoTen,
        },
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
  }
});

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
  
  res.json({
      ...created,
      IdCuocThi: created.IdCuocThi.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString()
  });
});

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

router.post("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai, TenHienThi } = req.body;

  try {
    const result = await prisma.cuocThi_DeBai.upsert({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      update: {
        TrangThai: true,
        TenHienThi: TenHienThi 
      },
      create: {
        IdCuocThi: contestId,
        IdDeBai: BigInt(IdDeBai),
        TenHienThi: TenHienThi || "",
        TrangThai: true 
      },
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi thêm bài vào cuộc thi" });
  }
});

router.delete("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai } = req.body;

  try {
    await prisma.cuocThi_DeBai.update({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      data: {
        TrangThai: false, 
      },
    });

    res.json({ success: true, message: "Đã ẩn bài khỏi cuộc thi" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa bài" });
  }
});

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


export default router;