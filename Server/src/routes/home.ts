import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { getAvatarUrl } from "../scripts/avatar";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const allSuccessfulSubmissions = await prisma.baiNop.findMany({
      where: { TrangThaiCham: { not: null } },
      select: { IdTaiKhoan: true, TrangThaiCham: true }
    });

    const isAccepted = (statusStr: string | null) => {
      try {
        if (!statusStr) return false;
        const codes = JSON.parse(statusStr);
        return Array.isArray(codes) && codes.length > 0 && codes.every(c => c === 0);
      } catch { return false; }
    };

    const userAcCount: Record<string, number> = {};
    allSuccessfulSubmissions.forEach(sub => {
      if (isAccepted(sub.TrangThaiCham)) {
        const uid = sub.IdTaiKhoan.toString();
        userAcCount[uid] = (userAcCount[uid] || 0) + 1;
      }
    });

    const topUserIds = Object.entries(userAcCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topUsers = await Promise.all(
      topUserIds.map(async ([uid, count]) => {
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

    const allSubmissionsForProblems = await prisma.baiNop.findMany({
      where: { TrangThaiCham: { not: null } },
      select: { IdDeBai: true, TrangThaiCham: true }
    });

    const problemAcCount: Record<string, number> = {};
    allSubmissionsForProblems.forEach(sub => {
      if (isAccepted(sub.TrangThaiCham)) {
        const pid = sub.IdDeBai.toString();
        problemAcCount[pid] = (problemAcCount[pid] || 0) + 1;
      }
    });

    const topProblemEntries = Object.entries(problemAcCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const topProblems = await Promise.all(
      topProblemEntries.map(async ([pid, count]) => {
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