import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// GET /api/contests/by-user/:userId - Lấy danh sách cuộc thi do user cụ thể tạo (Dùng cho trang quản lý)
router.get("/by-user/:userId", async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);

    const data = await prisma.cuocThi.findMany({
      where: { 
        IdTaiKhoan: userId // Chỉ lấy cuộc thi của user này
      },
      include: {
        deBais: { include: { deBai: true } },
        taiKhoan: { select: { TenDangNhap: true } }, // Lấy tên người tạo
        _count: {
          select: {
            dangKys: true,
            baiNops: true,
          },
        },
      },
      orderBy: { NgayTao: "desc" },
    });

    // Map dữ liệu trả về giống hệt cấu trúc cũ để Frontend không bị lỗi
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
        taiKhoan: c.taiKhoan, // Trả về thông tin người tạo
        _count: c._count,     // Trả về số lượng đk/bài nộp
        stats: {              // Helper stats cho frontend dễ dùng
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

// GET /api/contests/:contestId/problems/:problemId
router.get("/:contestId/problems/:problemId", async (req, res) => {
  const { contestId, problemId } = req.params;
  const { userId } = req.query; // Lấy userId từ query string (?userId=...)
  try {
    // 1. Kiểm tra ID có phải là số không trước khi chuyển sang BigInt để tránh crash
    if (isNaN(Number(contestId)) || isNaN(Number(problemId))) {
      return res.status(400).json({ error: "ID cuộc thi hoặc ID bài tập không hợp lệ" });
    }

    // 2. Xử lý userId an toàn
    let userFilter: any = false;
    if (userId && userId !== "" && !isNaN(Number(userId))) {
      userFilter = { 
        where: { 
          IdTaiKhoan: BigInt(userId as string), 
          TrangThai: true 
        } 
      };
    }

    // 3. Truy vấn Database
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
            // Chỉ lấy thông tin đăng ký của user đang kiểm tra
            dangKys: userFilter 
          }
        },
        deBai: {
          include: { taiKhoan: { select: { IdTaiKhoan: true, HoTen: true } } }
        }
      },
    });

    // Nếu không tìm thấy hoặc bài thi trong contest bị ẩn (TrangThai = false)
    if (!contestProblem || contestProblem.TrangThai === false) {
      return res.status(404).json({ error: "Bài tập không tồn tại hoặc đã bị gỡ khỏi cuộc thi" });
    }

    const { cuocThi, deBai, TenHienThi } = contestProblem;
    const now = new Date();
    const start = new Date(cuocThi.ThoiGianBatDau);
    const end = new Date(cuocThi.ThoiGianKetThuc);

    // 4. KIỂM TRA THỜI GIAN: Nếu chưa đến giờ, không cho xem đề
    if (now < start) {
      return res.status(403).json({ 
        error: "Cuộc thi chưa bắt đầu. Bạn không thể xem nội dung đề bài lúc này.",
        startTime: cuocThi.ThoiGianBatDau,
        serverTime: now
      });
    }

    // 5. KIỂM TRA QUYỀN: Đã đăng ký hay chưa? Cuộc thi kết thúc chưa?
    const isRegistered = Array.isArray(cuocThi.dangKys) && cuocThi.dangKys.length > 0;
    const isEnded = now > end;
    
    // Chỉ cho phép nộp nếu: Đã đăng ký VÀ Cuộc thi đang diễn ra
    const canSubmit = isRegistered && (now >= start && now <= end);

    // 6. Trả về dữ liệu
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
        NguoiTaoDe: deBai.taiKhoan.HoTen
      },
      permissions: {
        canSubmit,
        isRegistered,
        isEnded,
        message: isEnded 
          ? "Cuộc thi đã kết thúc." 
          : (!isRegistered ? "Bạn cần đăng ký cuộc thi để nộp bài." : "Bạn có thể nộp bài.")
      }
    });

  } catch (error: any) {
    console.error("Error at Contest Problem Detail API:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xử lý yêu cầu" });
  }
});

// [GET] /api/contests/:id - Lấy chi tiết cuộc thi & Kiểm tra trạng thái đăng ký
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Đảm bảo id là số trước khi chuyển BigInt
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID cuộc thi không hợp lệ" });
    }
    const contestId = BigInt(id);

    // Lấy userId từ query và ép kiểu an toàn về string
    const userIdRaw = req.query.userId;
    const userIdStr = typeof userIdRaw === 'string' ? userIdRaw : null;
    
    // Kiểm tra xem userIdStr có phải là một con số hợp lệ không
    const isValidUserId = userIdStr && !isNaN(Number(userIdStr)) && userIdStr !== "null" && userIdStr !== "undefined";

    const contest = await prisma.cuocThi.findUnique({
      where: { IdCuocThi: contestId },
      include: {
        taiKhoan: { select: { IdTaiKhoan: true, TenDangNhap: true, HoTen: true } },
        deBais: {
          where: { TrangThai: true },
          include: { deBai: true },
          orderBy: { IdDeBai: "asc" },
        },
        // Chỉ thực hiện truy vấn bảng đăng ký nếu có userId hợp lệ
        dangKys: isValidUserId ? {
          where: { 
            IdTaiKhoan: BigInt(userIdStr),
            // Ta không lọc TrangThai: true ở đây để lát nữa check được cả trường hợp user đã hủy
          } 
        } : false,
        _count: { select: { baiNops: true, dangKys: true } },
      },
    });

    if (!contest) return res.status(404).json({ error: "Cuộc thi không tồn tại" });

    // Kiểm tra trạng thái đăng ký
    // contest.dangKys lúc này là mảng chứa 1 phần tử (vì kết hợp khóa chính IdCuocThi + IdTaiKhoan)
    const isRegistered = Array.isArray(contest.dangKys) && 
                         contest.dangKys.length > 0 && 
                         contest.dangKys[0].TrangThai === true;

    const totalActiveRegistrations = await prisma.cuocThi_DangKy.count({
      where: {
        IdCuocThi: contestId,
        TrangThai: true
      }
    });

    const now = new Date();
    const start = new Date(contest.ThoiGianBatDau);
    const end = new Date(contest.ThoiGianKetThuc);
    
    // Tính toán Status
    let status = "Kết thúc";
    if (!contest.TrangThai) {
      status = "Đóng";
    } else if (now < start) {
      status = "Sắp mở";
    } else if (now >= start && now <= end) {
      status = "Đang thi";
    }

    // Trả về dữ liệu và ép kiểu BigInt sang String để JSON không lỗi
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
      // Map lại danh sách đề bài để convert BigInt
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
      Status: status,
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

// [POST] /api/contests/:id/register - Đăng ký
router.post("/:id/register", async (req, res) => {
  try {
    const { IdTaiKhoan } = req.body;
    const registration = await prisma.cuocThi_DangKy.upsert({
      where: { IdCuocThi_IdTaiKhoan: { IdCuocThi: BigInt(req.params.id), IdTaiKhoan: BigInt(IdTaiKhoan) } },
      update: { TrangThai: true },
      create: { IdCuocThi: BigInt(req.params.id), IdTaiKhoan: BigInt(IdTaiKhoan), TrangThai: true }
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: "Lỗi đăng ký" }); }
});

// [PUT] /api/contests/:id/unregister - Hủy đăng ký
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

// GET /api/contests - Lấy danh sách cuộc thi có phân trang
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
          taiKhoan: { select: { HoTen: true } } // Lấy tên người tạo
        },
        orderBy: { ThoiGianBatDau: "desc" },
        skip: skip,
        take: limit,
      }),
      prisma.cuocThi.count() // Tổng số cuộc thi để tính số trang
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
    res.status(500).json({ error: "Failed to load contests" });
  }
});

// GET /api/contests/:id/submissions - Lấy danh sách bài nộp của cuộc thi
router.get("/:id/submissions", async (req, res) => {
  try {
    const contestId = BigInt(req.params.id);
    
    // Ép kiểu an toàn từ query
    const querySearch = req.query.q as string | undefined;
    const queryProblemId = req.query.problemId as string | undefined;

    const submissions = await prisma.baiNop.findMany({
      where: {
        IdCuocThi: contestId,
        AND: [
          // Lọc theo tên người nộp (nếu có)
          querySearch ? {
            taiKhoan: {
              OR: [
                { HoTen: { contains: querySearch } },
                { TenDangNhap: { contains: querySearch } }
              ]
            }
          } : {},
          // Lọc theo ID bài tập (nếu có và phải là số)
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

// POST /api/contests - Tạo cuộc thi mới
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
  
  // Trả về JSON, xử lý BigInt bằng cách convert sang string (nếu chưa cấu hình global)
  res.json({
      ...created,
      IdCuocThi: created.IdCuocThi.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString()
  });
});

// PUT /api/contests/:id - Cập nhật thông tin chung cuộc thi
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

// ==================================================================
// 1. [SỬA] POST: Thêm bài (hoặc Khôi phục bài ẩn)
// Quan trọng: Phải trả về thông tin bài gốc (TieuDe) để FE hiển thị
// ==================================================================
router.post("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai, TenHienThi } = req.body;

  try {
    // Dùng upsert: Nếu có rồi thì update (khôi phục), chưa có thì create
    const result = await prisma.cuocThi_DeBai.upsert({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      update: {
        TrangThai: true, // Khôi phục trạng thái về 1 (Hiện)
        TenHienThi: TenHienThi // Cập nhật tên nếu có gửi lên
      },
      create: {
        IdCuocThi: contestId,
        IdDeBai: BigInt(IdDeBai),
        TenHienThi: TenHienThi || "",
        TrangThai: true // Tạo mới trạng thái là 1
      },
      // QUAN TRỌNG: Include deBai để lấy TieuDe trả về cho Frontend
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
        // Prisma đã include deBai vào result rồi
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi thêm bài vào cuộc thi" });
  }
});

// ==================================================================
// 2. [THÊM MỚI] DELETE: Xóa mềm (Đưa trạng thái về 0)
// API này chưa có trong code cũ của bạn
// ==================================================================
router.delete("/:id/problems", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdDeBai } = req.body;

  try {
    // Không xóa dòng dữ liệu, chỉ update TrangThai = false
    await prisma.cuocThi_DeBai.update({
      where: {
        IdCuocThi_IdDeBai: {
          IdCuocThi: contestId,
          IdDeBai: BigInt(IdDeBai),
        },
      },
      data: {
        TrangThai: false, // 0 = Ẩn/Xóa mềm
      },
    });

    res.json({ success: true, message: "Đã ẩn bài khỏi cuộc thi" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi xóa bài" });
  }
});

// ==================================================================
// 3. [GIỮ NGUYÊN] PUT: Sửa tên hiển thị hoặc cập nhật trạng thái thủ công
// ==================================================================
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

// PUT /api/contests/:id/kick - Hủy đăng ký (Kick) thí sinh
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

// GET /api/contests/:id - Lấy chi tiết cuộc thi
router.get("/:id", async (req, res) => {
  try {
    const contestId = BigInt(req.params.id);

    const contest = await prisma.cuocThi.findUnique({
      where: { 
        IdCuocThi: contestId,
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
        deBais: {
          where: {
            TrangThai: true,
          },
          include: {
            deBai: {
              select: {
                IdDeBai: true,
                TieuDe: true,
                DoKho: true,
                GioiHanThoiGian: true,
                GioiHanBoNho: true,
              },
            },
          },
          orderBy: {
            IdDeBai: "asc",
          },
        },
        dangKys: {
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
        _count: {
          select: {
            baiNops: true,
            dangKys: true,
          },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: "Cuộc thi không tồn tại" });
    }

    // Tính trạng thái cuộc thi
    const now = new Date();
    const start = new Date(contest.ThoiGianBatDau);
    const end = new Date(contest.ThoiGianKetThuc);
    
    let status = "Finished";
    if (!contest.TrangThai) {
      status = "Closed";
    } else if (now < start) {
      status = "Upcoming";
    } else if (now >= start && now <= end) {
      status = "Running";
    }

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
      Status: status,
      taiKhoan: {
        IdTaiKhoan: contest.taiKhoan.IdTaiKhoan.toString(),
        TenDangNhap: contest.taiKhoan.TenDangNhap,
        HoTen: contest.taiKhoan.HoTen,
        Email: contest.taiKhoan.Email,
      },
      deBais: contest.deBais.map((d) => ({
        IdCuocThi: d.IdCuocThi.toString(),
        IdDeBai: d.IdDeBai.toString(),
        TenHienThi: d.TenHienThi,
        TrangThai: d.TrangThai,
        deBai: d.deBai
          ? {
              IdDeBai: d.deBai.IdDeBai.toString(),
              TieuDe: d.deBai.TieuDe,
              DoKho: d.deBai.DoKho,
              GioiHanThoiGian: d.deBai.GioiHanThoiGian,
              GioiHanBoNho: d.deBai.GioiHanBoNho,
            }
          : null,
      })),
      dangKys: contest.dangKys.map((d) => ({
        IdCuocThi: d.IdCuocThi.toString(),
        IdTaiKhoan: d.IdTaiKhoan.toString(),
        TrangThai: d.TrangThai,
        taiKhoan: {
          IdTaiKhoan: d.taiKhoan.IdTaiKhoan.toString(),
          TenDangNhap: d.taiKhoan.TenDangNhap,
          HoTen: d.taiKhoan.HoTen,
        },
      })),
      stats: {
        totalProblems: contest.deBais.length,
        totalRegistrations: contest._count.dangKys,
        totalSubmissions: contest._count.baiNops,
      },
    });
  } catch (error: any) {
    console.error("Get contest detail error:", error);
    if (error.name === "PrismaClientValidationError" || error.message?.includes("BigInt")) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    res.status(500).json({ error: error.message || "Lỗi server khi lấy chi tiết cuộc thi" });
  }
});

// POST /api/contests/:id/register
router.post("/:id/register", async (req, res) => {
  const contestId = BigInt(req.params.id);
  const { IdTaiKhoan } = req.body;
  if (!IdTaiKhoan) return res.status(400).json({ error: "IdTaiKhoan required" });
  const created = await prisma.cuocThi_DangKy.create({
    data: { IdCuocThi: contestId, IdTaiKhoan },
  });
  // Convert BigInt for register response
  res.json({
      ...created,
      IdCuocThi: created.IdCuocThi.toString(),
      IdTaiKhoan: created.IdTaiKhoan.toString()
  });
});

export default router;