import { Router, Request, Response } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { TenDangNhap, MatKhau, HoTen, Email } = req.body;

    // Validation chi tiết
    if (!TenDangNhap || !MatKhau || !HoTen || !Email) {
      return res.status(400).json({ 
        error: "Vui lòng điền đầy đủ thông tin",
        field: !TenDangNhap ? "TenDangNhap" : !MatKhau ? "MatKhau" : !HoTen ? "HoTen" : "Email"
      });
    }

    // Validate username
    if (TenDangNhap.length < 3) {
      return res.status(400).json({ 
        error: "Tên đăng nhập phải có ít nhất 3 ký tự",
        field: "TenDangNhap"
      });
    }
    if (TenDangNhap.length > 50) {
      return res.status(400).json({ 
        error: "Tên đăng nhập không được vượt quá 50 ký tự",
        field: "TenDangNhap"
      });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(TenDangNhap)) {
      return res.status(400).json({ 
        error: "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới",
        field: "TenDangNhap"
      });
    }

    // Validate password
    if (MatKhau.length < 6) {
      return res.status(400).json({ 
        error: "Mật khẩu phải có ít nhất 6 ký tự",
        field: "MatKhau"
      });
    }
    if (MatKhau.length > 100) {
      return res.status(400).json({ 
        error: "Mật khẩu không được vượt quá 100 ký tự",
        field: "MatKhau"
      });
    }

    // Validate họ tên
    if (HoTen.trim().length < 2) {
      return res.status(400).json({ 
        error: "Họ tên phải có ít nhất 2 ký tự",
        field: "HoTen"
      });
    }
    if (HoTen.length > 50) {
      return res.status(400).json({ 
        error: "Họ tên không được vượt quá 50 ký tự",
        field: "HoTen"
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({ 
        error: "Email không hợp lệ",
        field: "Email"
      });
    }
    if (Email.length > 255) {
      return res.status(400).json({ 
        error: "Email không được vượt quá 255 ký tự",
        field: "Email"
      });
    }

    // Tìm role "User" mặc định (IdVaiTro = 2 thường là User)
    const userRole = await prisma.vaiTro.findFirst({
      where: { TenVaiTro: "User" },
    });

    if (!userRole) {
      return res.status(500).json({ error: "User role not found" });
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await prisma.taiKhoan.findUnique({
      where: { TenDangNhap },
    });

    if (existingUsername) {
      return res.status(400).json({ 
        error: "Tên đăng nhập đã được sử dụng",
        field: "TenDangNhap"
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await prisma.taiKhoan.findUnique({
      where: { Email },
    });

    if (existingEmail) {
      return res.status(400).json({ 
        error: "Email đã được sử dụng",
        field: "Email"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(MatKhau, 10);

    // Tạo user mới
    const newUser = await prisma.taiKhoan.create({
      data: {
        IdVaiTro: userRole.IdVaiTro,
        TenDangNhap,
        MatKhau: hashedPassword,
        HoTen,
        Email,
      },
      include: {
        vaiTro: true,
      },
    });

    // Tạo JWT token
    const token = jwt.sign(
      {
        userId: newUser.IdTaiKhoan.toString(),
        userRole: newUser.vaiTro.TenVaiTro,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        IdTaiKhoan: newUser.IdTaiKhoan.toString(),
        TenDangNhap: newUser.TenDangNhap,
        HoTen: newUser.HoTen,
        Email: newUser.Email,
        VaiTro: newUser.vaiTro.TenVaiTro,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { TenDangNhap, MatKhau } = req.body;

    // Validation
    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({ 
        error: "Vui lòng nhập tên đăng nhập và mật khẩu",
        field: !TenDangNhap ? "TenDangNhap" : "MatKhau"
      });
    }

    if (TenDangNhap.trim().length === 0) {
      return res.status(400).json({ 
        error: "Tên đăng nhập không được để trống",
        field: "TenDangNhap"
      });
    }

    if (MatKhau.trim().length === 0) {
      return res.status(400).json({ 
        error: "Mật khẩu không được để trống",
        field: "MatKhau"
      });
    }

    // Tìm user
    const user = await prisma.taiKhoan.findUnique({
      where: { TenDangNhap },
      include: { vaiTro: true },
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Tên đăng nhập hoặc mật khẩu không đúng",
        field: "general"
      });
    }

    // Kiểm tra password
    const isValidPassword = await bcrypt.compare(MatKhau, user.MatKhau);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: "Tên đăng nhập hoặc mật khẩu không đúng",
        field: "general"
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.TrangThai) {
      return res.status(403).json({ 
        error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên",
        field: "general"
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        userId: user.IdTaiKhoan.toString(),
        userRole: user.vaiTro.TenVaiTro,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        IdTaiKhoan: user.IdTaiKhoan.toString(),
        TenDangNhap: user.TenDangNhap,
        HoTen: user.HoTen,
        Email: user.Email,
        VaiTro: user.vaiTro.TenVaiTro,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// GET /api/auth/me - Lấy thông tin user hiện tại (cần auth)
router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      userRole: string;
    };

    const user = await prisma.taiKhoan.findUnique({
      where: { IdTaiKhoan: BigInt(decoded.userId) },
      select: {
        IdTaiKhoan: true,
        TenDangNhap: true,
        HoTen: true,
        Email: true,
        TrangThai: true,
        NgayTao: true,
        vaiTro: {
          select: {
            TenVaiTro: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      IdTaiKhoan: user.IdTaiKhoan.toString(),
      TenDangNhap: user.TenDangNhap,
      HoTen: user.HoTen,
      Email: user.Email,
      TrangThai: user.TrangThai,
      NgayTao: user.NgayTao,
      VaiTro: user.vaiTro.TenVaiTro,
    });
  } catch (error: any) {
    console.error("Get me error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

