import { Router } from "express";
import { prisma } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { q, topics, difficulty } = req.query;

    let whereClause: any = {
      TrangThai: true,
      DangCongKhai: true,
      TieuDe: q ? { contains: q as string } : undefined,
    };

    const andConditions = [];

    if (difficulty && difficulty !== "all") {
      const parts = (difficulty as string).split("-");
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);

        if (!isNaN(min) && !isNaN(max)) {
          const rangeArray = [];
          for (let i = min; i <= max; i++) {
            rangeArray.push(i.toString());
          }

          andConditions.push({
            DoKho: {
              in: rangeArray
            }
          });
        }
      }
    }

    if (topics && topics !== "all") {
      const topicArray = (topics as string).split(",");
      andConditions.push({
        deBaiChuDes: {
          some: {
            chuDe: {
              TenChuDe: { in: topicArray }
            }
          }
        }
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const [data, total] = await Promise.all([
      prisma.deBai.findMany({
        where: whereClause,
        include: {
          taiKhoan: { select: { IdTaiKhoan: true, HoTen: true } },
          deBaiChuDes: { include: { chuDe: true } }
        },
        orderBy: { NgayTao: "desc" },
        skip,
        take: limit,
      }),
      prisma.deBai.count({ where: whereClause })
    ]);

    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      problems: data.map((p) => ({
        ...p,
        IdDeBai: p.IdDeBai.toString(),
        IdTaiKhoan: p.IdTaiKhoan.toString(),
        chuDes: p.deBaiChuDes.map(dc => dc.chuDe.TenChuDe)
      }))
    });
  } catch (error: any) {
    console.error("🔥 API PROBLEMS ERROR:", error.message);
    res.status(500).json({ error: "Lỗi Server: " + error.message });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const problem = await prisma.deBai.findUnique({
      where: {
        IdDeBai: BigInt(id),
        TrangThai: true,
        DangCongKhai: true,
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
        boTests: {          
          select: {
            DuongDanInput: true,
            DuongDanOutput: true,
          },
        },
        deBaiChuDes: true, 
      },
    });

    if (!problem) {
      return res.status(404).json({ error: "Bài tập không tồn tại" });
    }

    res.json({
      IdDeBai: problem.IdDeBai.toString(),
      IdTaiKhoan: problem.IdTaiKhoan.toString(),
      TieuDe: problem.TieuDe,
      NoiDungDeBai: problem.NoiDungDeBai,
      DoKho: problem.DoKho,
      GioiHanThoiGian: problem.GioiHanThoiGian,
      GioiHanBoNho: problem.GioiHanBoNho,
      DangCongKhai: problem.DangCongKhai,
      isReady: !!(problem.boTests[0]?.DuongDanInput && problem.boTests[0]?.DuongDanOutput),
      DuongDanInput: problem.boTests[0]?.DuongDanInput ?? "",
      DuongDanOutput: problem.boTests[0]?.DuongDanOutput ?? "",
      NgayTao: problem.NgayTao,
      TrangThai: problem.TrangThai,
      taiKhoan: problem.taiKhoan
        ? {
            IdTaiKhoan: problem.taiKhoan.IdTaiKhoan.toString(),
            HoTen: problem.taiKhoan.HoTen,
          }
        : null,
      
      topicIds: problem.deBaiChuDes.map((t) => Number(t.IdChuDe)),
    });
  } catch (error: any) {
    console.error("Error fetching problem:", error);

    if (error.name === "PrismaClientValidationError" || error.message.includes("BigInt")) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    res.status(500).json({ error: "Lỗi server khi lấy chi tiết bài tập" });
  }
});

export default router;