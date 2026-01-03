import { Router } from "express";
import { prisma } from "../db";

import { getAvatarUrl } from "../scripts/avatar";

const router = Router();

router.get("/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.baiDang.findMany({
        where: { TrangThai: true },
        include: { 
          taiKhoan: { 
            select: { 
              HoTen: true, 
              Email: true
            } 
          } 
        },
        orderBy: [{ UuTien: "desc" }, { NgayCapNhat: "desc" }],
        skip,
        take: limit,
      }),
      prisma.baiDang.count({ where: { TrangThai: true } }),
    ]);

    const formattedItems = posts.map(p => {
      const avatarUrl = getAvatarUrl(p.taiKhoan.Email);

      const { Email, ...taiKhoanWithoutEmail } = p.taiKhoan;

      return {
        ...p,
        IdBaiDang: p.IdBaiDang.toString(),
        IdTaiKhoan: p.IdTaiKhoan.toString(),
        taiKhoan: {
          ...taiKhoanWithoutEmail,
          Avatar: avatarUrl
        }
      };
    });

    res.json({
      items: formattedItems,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Lỗi lấy bài đăng:", error);
    res.status(500).json({ error: "Lỗi lấy bài đăng" });
  }
});

router.get("/manage", async (req, res) => {
  const { userId, role } = req.query; 
  try {
    const whereCondition = role === "Admin" ? {} : { IdTaiKhoan: BigInt(userId as string) };
    
    const posts = await prisma.baiDang.findMany({
      where: whereCondition,
      orderBy: { NgayTao: "desc" }
    });

    res.json(posts.map(p => ({ ...p, IdBaiDang: p.IdBaiDang.toString(), IdTaiKhoan: p.IdTaiKhoan.toString() })));
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.post("/", async (req, res) => {
  const { IdTaiKhoan, TieuDe, NoiDung, UuTien, TrangThai } = req.body;
  try {
    const post = await prisma.baiDang.create({
      data: {
        IdTaiKhoan: BigInt(IdTaiKhoan),
        TieuDe,
        NoiDung,
        UuTien: UuTien || 1,
        TrangThai: TrangThai ?? true
      }
    });
    res.json({ message: "Đã tạo bài đăng", id: post.IdBaiDang.toString() });
  } catch (error) {
    res.status(500).json({ error: "Lỗi tạo bài đăng" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { TieuDe, NoiDung, UuTien, TrangThai, role } = req.body;

  try {
    const updateData: any = { TieuDe, NoiDung, TrangThai };
    
    if (role === "admin" && UuTien !== undefined) {
      updateData.UuTien = parseInt(UuTien);
    }

    const updated = await prisma.baiDang.update({
      where: { IdBaiDang: BigInt(id) },
      data: updateData
    });

    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật" });
  }
});

export default router;