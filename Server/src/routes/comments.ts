import { Router } from "express";
import { prisma } from "../db";

import { getAvatarUrl } from "../scripts/avatar";
import { containsSensitiveWords } from "../scripts/scan"

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { problemId } = req.query;
    if (!problemId) return res.status(400).json({ error: "problemId is required" });
    
    const allComments = await prisma.binhLuan.findMany({
      where: { 
        IdDeBai: BigInt(problemId as string),
        TrangThai: true,
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
      orderBy: { NgayTao: "asc" },
    });
    
    const rootComments = allComments.filter((c) => !c.IdBinhLuanCha);
    const replies = allComments.filter((c) => c.IdBinhLuanCha);
    
    const commentMap = new Map<string, any>();
    allComments.forEach((c) => {
      commentMap.set(c.IdBinhLuan.toString(), c);
    });
    
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
              HoTen: comment.taiKhoan.HoTen,
              Avatar: getAvatarUrl(comment.taiKhoan.Email),
            }
          : null,
        parentUser: comment.binhLuanCha?.taiKhoan
          ? {
              IdTaiKhoan: comment.binhLuanCha.taiKhoan.IdTaiKhoan.toString(),
              HoTen: comment.binhLuanCha.taiKhoan.HoTen,
            }
          : null,
        replies: childReplies
          .sort((a, b) => new Date(a.NgayTao).getTime() - new Date(b.NgayTao).getTime())
          .map((r) => buildCommentTree(r)),
      };
    };
    
    const result = rootComments
      .sort((a, b) => new Date(a.NgayTao).getTime() - new Date(b.NgayTao).getTime())
      .map((c) => buildCommentTree(c));
    
    res.json(result);
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: error.message || "Failed to fetch comments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { IdDeBai, IdTaiKhoan, NoiDung, IdBinhLuanCha } = req.body;
    
    if (!IdDeBai || !IdTaiKhoan || !NoiDung) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (!NoiDung.trim()) {
      return res.status(400).json({ error: "Comment content cannot be empty" });
    }

    if (containsSensitiveWords(NoiDung.trim())) {
      return res.status(400).json({ 
        error: "Bình luận chứa nội dung không phù hợp và không thể đăng tải." 
      });
    }
    
    if (IdBinhLuanCha) {
      const parentComment = await prisma.binhLuan.findUnique({
        where: { IdBinhLuan: BigInt(IdBinhLuanCha) },
      });
      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
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
      IdBinhLuanCha: created.IdBinhLuanCha ? created.IdBinhLuanCha.toString() : null,
      NoiDung: created.NoiDung,
      NgayTao: created.NgayTao,
      taiKhoan: created.taiKhoan
        ? {
            IdTaiKhoan: created.taiKhoan.IdTaiKhoan.toString(),
            HoTen: created.taiKhoan.HoTen,
          }
        : null,
      parentUser: created.binhLuanCha?.taiKhoan
        ? {
            IdTaiKhoan: created.binhLuanCha.taiKhoan.IdTaiKhoan.toString(),
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

