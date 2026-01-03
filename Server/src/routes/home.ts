import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { getAvatarUrl } from "../scripts/avatar";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const allSuccessfulSubmissions = await prisma.baiNop.findMany({
      where: { TrangThaiCham: { not: null } },
      select: { IdTaiKhoan: true, IdDeBai: true, TrangThaiCham: true }
    });

    const isAccepted = (statusStr: string | null) => {
      try {
        if (!statusStr) return false;
        const codes = JSON.parse(statusStr);
        return Array.isArray(codes) && codes.length > 0 && codes.every(c => c === 0);
      } catch { return false; }
    };

    const acSubmissions = allSuccessfulSubmissions.filter(sub => isAccepted(sub.TrangThaiCham));

    const userSolvedMap: Record<string, Set<string>> = {};
    acSubmissions.forEach(sub => {
      const uid = sub.IdTaiKhoan.toString();
      const pid = sub.IdDeBai.toString();
      if (!userSolvedMap[uid]) userSolvedMap[uid] = new Set();
      userSolvedMap[uid].add(pid); // Thêm IdDeBai vào Set của User đó
    });

    const topUserIds = Object.entries(userSolvedMap)
      .map(([uid, solvedSet]) => ({ uid, count: solvedSet.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topUsers = await Promise.all(
      topUserIds.map(async ({ uid, count }) => {
        const user = await prisma.taiKhoan.findUnique({
          where: { IdTaiKhoan: BigInt(uid) },
          select: { HoTen: true, Email: true }
        });
        return {
          id: uid,
          name: user?.HoTen || "Unknown",
          avatar: getAvatarUrl(user?.Email || ""),
          acCount: count
        };
      })
    );

    const problemUserMap: Record<string, Set<string>> = {};
    acSubmissions.forEach(sub => {
      const pid = sub.IdDeBai.toString();
      const uid = sub.IdTaiKhoan.toString();
      if (!problemUserMap[pid]) problemUserMap[pid] = new Set();
      problemUserMap[pid].add(uid); // Thêm IdTaiKhoan vào Set của Bài tập đó
    });

    const topProblemEntries = Object.entries(problemUserMap)
      .map(([pid, userSet]) => ({ pid, count: userSet.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topProblems = await Promise.all(
      topProblemEntries.map(async ({ pid, count }) => {
        const problem = await prisma.deBai.findUnique({
          where: { IdDeBai: BigInt(pid) },
          select: { TieuDe: true }
        });
        return {
          id: pid,
          title: problem?.TieuDe || "Bài tập không tên",
          acCount: count
        };
      })
    );

    res.json({
      users: topUsers,
      problems: topProblems
    });

  } catch (error: any) {
    console.error("Home Stats Error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy thống kê" });
  }
});

export default router;