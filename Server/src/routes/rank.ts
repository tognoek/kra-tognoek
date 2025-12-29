import { Router } from "express";
import { prisma } from "../db";

import { getAvatarUrl } from "../scripts/avatar";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const contestId = BigInt(req.params.id);

    const contest = await prisma.cuocThi.findUnique({
      where: { IdCuocThi: contestId },
      include: {
        deBais: {
          where: { TrangThai: true },
          orderBy: { IdDeBai: 'asc' },
          select: { IdDeBai: true, TenHienThi: true }
        },
        dangKys: {
          where: { TrangThai: true },
          include: {
            taiKhoan: { select: { IdTaiKhoan: true, HoTen: true, Email: true } }
          }
        }
      }
    });

    if (!contest) return res.status(404).json({ error: "Cuộc thi không tồn tại" });

    const allSubmissions = await prisma.baiNop.findMany({
      where: { IdCuocThi: contestId },
      orderBy: { NgayNop: 'asc' }
    });

    const leaderboard = contest.dangKys.map(reg => {
      const user = reg.taiKhoan;
      const userSubmissions = allSubmissions.filter(s => s.IdTaiKhoan === user.IdTaiKhoan);
      const problemStats = contest.deBais.map(prob => {
        const pSubs = userSubmissions.filter(s => s.IdDeBai === prob.IdDeBai);
        
        const solvedSub = pSubs.find(s => {
          if (!s.TrangThaiCham) return false;
          try {
            const codes = JSON.parse(s.TrangThaiCham);
            return Array.isArray(codes) && codes.length > 0 && codes.every((c: number) => c === 0);
          } catch { return false; }
        });

        const lastSub = pSubs[pSubs.length - 1];

        return {
          IdDeBai: prob.IdDeBai.toString(),
          isSolved: !!solvedSub,
          attempts: pSubs.length,
          lastSubmitTime: lastSub ? lastSub.NgayNop : null,
          executionTime: solvedSub?.ThoiGianThucThi || lastSub?.ThoiGianThucThi || 0,
          memoryUsage: solvedSub?.BoNhoSuDung || lastSub?.BoNhoSuDung || 0,
          firstSolveTime: solvedSub ? solvedSub.NgayNop : null
        };
      });

      const solvedProblems = problemStats.filter(p => p.isSolved);
      
      return {
        user: {
          IdTaiKhoan: user.IdTaiKhoan.toString(),
          HoTen: user.HoTen,
          Avatar: getAvatarUrl(user.Email),
        },
        problemStats,
        totalPoints: solvedProblems.length,
        firstSolveTime: solvedProblems.length > 0 
          ? Math.min(...solvedProblems.map(p => new Date(p.firstSolveTime!).getTime())) 
          : Infinity,
        executionTimes: solvedProblems.map(p => p.executionTime).sort((a, b) => a - b),
        totalMemory: solvedProblems.reduce((sum, p) => sum + p.memoryUsage, 0)
      };
    });

    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.firstSolveTime !== b.firstSolveTime) return a.firstSolveTime - b.firstSolveTime;
      
      const len = Math.max(a.executionTimes.length, b.executionTimes.length);
      for (let i = 0; i < len; i++) {
        const tA = a.executionTimes[i] ?? Infinity;
        const tB = b.executionTimes[i] ?? Infinity;
        if (tA !== tB) return tA - tB;
      }
      return a.totalMemory - b.totalMemory;
    });

    res.json({
      contestName: contest.TenCuocThi,
      problems: contest.deBais.map(p => ({ IdDeBai: p.IdDeBai.toString(), Ten: p.TenHienThi })),
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry
      }))
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi Server" });
  }
});

export default router;