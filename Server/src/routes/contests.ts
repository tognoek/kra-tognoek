import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.get("/:contestId/problems/:problemId", async (req, res) => {
  const { contestId, problemId } = req.params;
  const { userId } = req.query;
  try {
    if (isNaN(Number(contestId)) || isNaN(Number(problemId))) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    let userFilter: any = false;
    if (userId && userId !== "" && !isNaN(Number(userId))) {
      userFilter = { where: { IdTaiKhoan: BigInt(userId as string), TrangThai: true } };
    }

    const contestProblem = await prisma.cuocThi_DeBai.findUnique({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: BigInt(contestId),
          IdDeBai: BigInt(problemId),
        },
      },
      include: {
        cuocThi: {
          include: {
            taiKhoan: { select: { HoTen: true } },
            dangKys: userFilter 
          }
        },
        deBai: {
          include: { 
            taiKhoan: { select: { IdTaiKhoan: true, HoTen: true } },
            boTests: { take: 1 }
          }
        }
      },
    });

    if (!contestProblem || contestProblem.TrangThai === false) {
      return res.status(404).json({ error: "Bài tập không tồn tại" });
    }

    const { cuocThi, deBai, TenHienThi } = contestProblem;
    const now = new Date();
    const start = new Date(cuocThi.ThoiGianBatDau);
    const end = new Date(cuocThi.ThoiGianKetThuc);

    if (now < start) {
      return res.status(403).json({ error: "Cuộc thi chưa bắt đầu." });
    }

    const isRegistered = Array.isArray(cuocThi.dangKys) && cuocThi.dangKys.length > 0;
    const isEnded = now > end;
    const canSubmit = isRegistered && (now >= start && now <= end);

    const firstTest = deBai.boTests[0];

    res.json({
      contestInfo: {
        IdCuocThi: contestId,
        TenCuocThi: cuocThi.TenCuocThi,
        NguoiTaoContest: cuocThi.taiKhoan.HoTen,
        Status: isEnded ? "Finished" : "Running",
      },
      problem: {
        IdDeBai: deBai.IdDeBai.toString(),
        TieuDe: TenHienThi || deBai.TieuDe,
        NoiDungDeBai: deBai.NoiDungDeBai,
        DoKho: deBai.DoKho,
        GioiHanThoiGian: deBai.GioiHanThoiGian,
        GioiHanBoNho: deBai.GioiHanBoNho,
        NguoiTaoDe: deBai.taiKhoan.HoTen,
        isReady: !!(firstTest?.DuongDanInput && firstTest?.DuongDanOutput),
        DuongDanInput: firstTest?.DuongDanInput ?? "",
        DuongDanOutput: firstTest?.DuongDanOutput ?? ""
      },
      permissions: {
        canSubmit,
        isRegistered,
        isEnded,
        message: isEnded ? "Kết thúc" : (isRegistered ? "Sẵn sàng" : "Chưa đăng ký")
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID cuộc thi không hợp lệ" });
    }
    const contestId = BigInt(id);

    const userIdRaw = req.query.userId;
    const userIdStr = typeof userIdRaw === 'string' ? userIdRaw : null;
    
    const isValidUserId = userIdStr && !isNaN(Number(userIdStr)) && userIdStr !== "null" && userIdStr !== "undefined";

    const contest = await prisma.cuocThi.findUnique({
      where: { IdCuocThi: contestId },
      include: {
        taiKhoan: { select: { IdTaiKhoan: true, HoTen: true } },
        deBais: {
          where: { TrangThai: true },
          include: { deBai: true },
          orderBy: { IdDeBai: "asc" },
        },
        dangKys: isValidUserId ? {
          where: { 
            IdTaiKhoan: BigInt(userIdStr),
          } 
        } : false,
        _count: { select: { baiNops: true, dangKys: true } },
      },
    });

    if (!contest) return res.status(404).json({ error: "Cuộc thi không tồn tại" });

    const isRegistered = Array.isArray(contest.dangKys) && 
                         contest.dangKys.length > 0 && 
                         contest.dangKys[0].TrangThai === true;

    const totalActiveRegistrations = await prisma.cuocThi_DangKy.count({
      where: {
        IdCuocThi: contestId,
        TrangThai: true
      }
    });

    res.json({
      IdCuocThi: contest.IdCuocThi.toString(),
      IdTaiKhoan: contest.IdTaiKhoan.toString(),
      TenCuocThi: contest.TenCuocThi,
      MoTa: contest.MoTa,
      ThoiGianBatDau: contest.ThoiGianBatDau,
      ThoiGianKetThuc: contest.ThoiGianKetThuc,
      TrangThai: contest.TrangThai,
      NgayTao: contest.NgayTao,
      ChuY: contest.ChuY,
      taiKhoan: {
        ...contest.taiKhoan,
        IdTaiKhoan: contest.taiKhoan.IdTaiKhoan.toString()
      },
      deBais: contest.deBais.map(d => ({
        ...d,
        IdCuocThi: d.IdCuocThi.toString(),
        IdDeBai: d.IdDeBai.toString(),
        deBai: d.deBai ? {
          ...d.deBai,
          IdDeBai: d.deBai.IdDeBai.toString()
        } : null
      })),
      isUserRegistered: isRegistered,
      stats: {
        totalProblems: contest.deBais.length,
        totalRegistrations: totalActiveRegistrations,
        totalSubmissions: contest._count.baiNops,
      }
    });
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi tải thông tin cuộc thi" });
  }
});

router.post("/:id/register", async (req, res) => {
  try {
    const { IdTaiKhoan } = req.body;
    const _registration = await prisma.cuocThi_DangKy.upsert({
      where: { IdCuocThi_IdTaiKhoan: { IdCuocThi: BigInt(req.params.id), IdTaiKhoan: BigInt(IdTaiKhoan) } },
      update: { TrangThai: true },
      create: { IdCuocThi: BigInt(req.params.id), IdTaiKhoan: BigInt(IdTaiKhoan), TrangThai: true }
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Lỗi đăng ký" }); }
});

router.put("/:id/unregister", async (req, res) => {
  try {
    const { IdTaiKhoan } = req.body;
    await prisma.cuocThi_DangKy.update({
      where: { IdCuocThi_IdTaiKhoan: { IdCuocThi: BigInt(req.params.id), IdTaiKhoan: BigInt(IdTaiKhoan) } },
      data: { TrangThai: false }
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Lỗi hủy đăng ký" }); }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
              const [data, total] = await Promise.all([
      prisma.cuocThi.findMany({
        include: {
          deBais: { 
            where: { TrangThai: true},
            include: { deBai: true }, 
          },
          taiKhoan: { select: { HoTen: true } }
        },
        orderBy: { ThoiGianBatDau: "desc" },
        skip: skip,
        take: limit,
      }),
      prisma.cuocThi.count() 
    ]);

    res.json({
      contests: data.map((c) => ({
        ...c,
        IdCuocThi: c.IdCuocThi.toString(),
        IdTaiKhoan: c.IdTaiKhoan.toString(),
        HoTenTacGia: c.taiKhoan?.HoTen || "Admin",
        deBais: c.deBais.map((d) => ({
          IdCuocThi: d.IdCuocThi.toString(),
          IdDeBai: d.IdDeBai.toString(),
          TenHienThi: d.TenHienThi,
        })),
      })),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load contests" });
  }
});

router.get("/:id/submissions", async (req, res) => {
  try {
    const contestId = BigInt(req.params.id);
    
    const querySearch = req.query.q as string | undefined;
    const queryProblemId = req.query.problemId as string | undefined;

    const submissions = await prisma.baiNop.findMany({
      where: {
        IdCuocThi: contestId,
        AND: [
          querySearch ? {
            taiKhoan: {
              OR: [
                { HoTen: { contains: querySearch } },
                { TenDangNhap: { contains: querySearch } }
              ]
            }
          } : {},
          (queryProblemId && !isNaN(Number(queryProblemId))) ? { 
            IdDeBai: BigInt(queryProblemId) 
          } : {}
        ]
      },
      include: {
        taiKhoan: { select: { HoTen: true, TenDangNhap: true } },
        deBai: { select: { TieuDe: true } },
        ngonNgu: { select: { TenNgonNgu: true } }
      },
      orderBy: { NgayNop: "desc" }
    });

    res.json(submissions.map(s => ({
      ...s,
      IdBaiNop: s.IdBaiNop.toString(),
      IdTaiKhoan: s.IdTaiKhoan.toString(),
      IdDeBai: s.IdDeBai.toString(),
      IdNgonNgu: s.IdNgonNgu.toString(),
      IdCuocThi: s.IdCuocThi?.toString(),
    })));
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Lỗi khi tải danh sách bài nộp" });
  }
});

router.post("/:id/register", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdTaiKhoan } = req.body;
  if (!IdTaiKhoan) return res.status(400).json({ error: "IdTaiKhoan required" });
  const created = await prisma.cuocThi_DangKy.create({
    data: { IdCuocThi: contestId, IdTaiKhoan },
  });
  res.json({
      ...created,
      IdCuocThi: created.IdCuocThi.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString()
  });
});

export default router;