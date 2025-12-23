import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/comments?problemId=...
router.get("/", async (req, res) => {
  try {
    const { problemId } = req.query;
    if (!problemId) return res.status(400).json({ error: "problemId is required" });
    
    // Lấy tất cả comments (bao gồm cả reply)
    const allComments = await prisma.binhLuan.findMany({
      where: { IdDeBai: BigInt(problemId as string) },
      include: {
        taiKhoan: {
          select: {
            IdTaiKhoan: true,
            TenDangNhap: true,
            HoTen: true,
            Email: true,
          },
        },
        binhLuanCha: {
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
      },
      orderBy: { NgayTao: "asc" },
    });
    
    // Tách comments gốc và replies
    const rootComments = allComments.filter((c) => !c.IdBinhLuanCha);
    const replies = allComments.filter((c) => c.IdBinhLuanCha);
    
    // Tạo map để dễ lookup
    const commentMap = new Map<string, any>();
    allComments.forEach((c) => {
      commentMap.set(c.IdBinhLuan.toString(), c);
    });
    
    // Hàm đệ quy để build nested replies
    const buildCommentTree = (comment: any): any => {
      const commentId = comment.IdBinhLuan.toString();
      const childReplies = replies.filter(
        (r) => r.IdBinhLuanCha?.toString() === commentId
      );
      
      return {
        IdBinhLuan: comment.IdBinhLuan.toString(),
        IdDeBai: comment.IdDeBai.toString(),
        IdTaiKhoan: comment.IdTaiKhoan.toString(),
        IdBinhLuanCha: comment.IdBinhLuanCha ? comment.IdBinhLuanCha.toString() : null,
        NoiDung: comment.NoiDung,
        NgayTao: comment.NgayTao,
        taiKhoan: comment.taiKhoan
          ? {
              IdTaiKhoan: comment.taiKhoan.IdTaiKhoan.toString(),
              TenDangNhap: comment.taiKhoan.TenDangNhap,
              HoTen: comment.taiKhoan.HoTen,
              Email: comment.taiKhoan.Email,
            }
          : null,
        parentUser: comment.binhLuanCha?.taiKhoan
          ? {
              IdTaiKhoan: comment.binhLuanCha.taiKhoan.IdTaiKhoan.toString(),
              TenDangNhap: comment.binhLuanCha.taiKhoan.TenDangNhap,
              HoTen: comment.binhLuanCha.taiKhoan.HoTen,
            }
          : null,
        replies: childReplies
          .sort((a, b) => new Date(a.NgayTao).getTime() - new Date(b.NgayTao).getTime())
          .map((r) => buildCommentTree(r)),
      };
    };
    
    // Build tree cho tất cả root comments
    const result = rootComments
      .sort((a, b) => new Date(a.NgayTao).getTime() - new Date(b.NgayTao).getTime())
      .map((c) => buildCommentTree(c));
    
    res.json(result);
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: error.message || "Failed to fetch comments" });
  }
});

// POST /api/comments
router.post("/", async (req, res) => {
  try {
    const { IdDeBai, IdTaiKhoan, NoiDung, IdBinhLuanCha } = req.body;
    
    if (!IdDeBai || !IdTaiKhoan || !NoiDung) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (!NoiDung.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }
    
    // Nếu là reply, kiểm tra parent comment có tồn tại không
    if (IdBinhLuanCha) {
      const parentComment = await prisma.binhLuan.findUnique({
        where: { IdBinhLuan: BigInt(IdBinhLuanCha) },
      });
      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
      // Đảm bảo reply cùng problem với parent
      if (parentComment.IdDeBai.toString() !== IdDeBai) {
        return res.status(400).json({ error: "Reply must be on the same problem" });
      }
    }
    
    const created = await prisma.binhLuan.create({
      data: {
        IdDeBai: BigInt(IdDeBai),
        IdTaiKhoan: BigInt(IdTaiKhoan),
        IdBinhLuanCha: IdBinhLuanCha ? BigInt(IdBinhLuanCha) : null,
        NoiDung: NoiDung.trim(),
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
        binhLuanCha: {
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
      },
    });
    
    res.json({
      IdBinhLuan: created.IdBinhLuan.toString(),
      IdDeBai: created.IdDeBai.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString(),
      IdBinhLuanCha: created.IdBinhLuanCha ? created.IdBinhLuanCha.toString() : null,
      NoiDung: created.NoiDung,
      NgayTao: created.NgayTao,
      taiKhoan: created.taiKhoan
        ? {
            IdTaiKhoan: created.taiKhoan.IdTaiKhoan.toString(),
            TenDangNhap: created.taiKhoan.TenDangNhap,
            HoTen: created.taiKhoan.HoTen,
            Email: created.taiKhoan.Email,
          }
        : null,
      parentUser: created.binhLuanCha?.taiKhoan
        ? {
            IdTaiKhoan: created.binhLuanCha.taiKhoan.IdTaiKhoan.toString(),
            TenDangNhap: created.binhLuanCha.taiKhoan.TenDangNhap,
            HoTen: created.binhLuanCha.taiKhoan.HoTen,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: error.message || "Failed to create comment" });
  }
});

export default router;

