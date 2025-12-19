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

    if (!TenDangNhap || !MatKhau || !HoTen || !Email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Tìm role "User" mặc định (IdVaiTro = 2 thường là User)
    const userRole = await prisma.vaiTro.findFirst({
      where: { TenVaiTro: "User" },
    });

    if (!userRole) {
      return res.status(500).json({ error: "User role not found" });
    }

    // Kiểm tra username và email đã tồn tại chưa
    const existingUser = await prisma.taiKhoan.findFirst({
      where: {
        OR: [{ TenDangNhap }, { Email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
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

    if (!TenDangNhap || !MatKhau) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Tìm user
    const user = await prisma.taiKhoan.findUnique({
      where: { TenDangNhap },
      include: { vaiTro: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Kiểm tra password
    const isValidPassword = await bcrypt.compare(MatKhau, user.MatKhau);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.TrangThai) {
      return res.status(403).json({ error: "Account is disabled" });
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
      include: { vaiTro: true },
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

