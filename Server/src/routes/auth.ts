import { Router, Request, Response } from "express";
import { prisma } from "../db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendForgotPasswordEmail } from "../scripts/mail";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

router.post("/check-availability", async (req: Request, res: Response) => {
    try {
        const { TenDangNhap, Email } = req.body;

        const existing = await prisma.taiKhoan.findFirst({
            where: {
                OR: [{ TenDangNhap }, { Email }]
            }
        });

        if (existing) {
            return res.status(400).json({
                error: existing.Email === Email ? "Email đã được sử dụng" : "Tên tài khoản đã tồn tại",
                field: existing.Email === Email ? "Email" : "TenDangNhap"
            });
        }

        res.json({ available: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/register", async (req: Request, res: Response) => {
    try {
        const { TenDangNhap, MatKhau, HoTen, Email, firebaseUid } = req.body;

        if (!TenDangNhap || !MatKhau || !HoTen || !Email || !firebaseUid) {
            return res.status(400).json({ error: "Thiếu thông tin đăng ký bắt buộc" });
        }

        const userRole = await prisma.vaiTro.findFirst({
            where: { TenVaiTro: "User" },
        });

        if (!userRole) {
            return res.status(500).json({ error: "Hệ thống chưa cấu hình Vai trò người dùng" });
        }

        if (MatKhau.length < 6) {
            return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        const hashedPassword = await bcrypt.hash(MatKhau, 10);

        const newUser = await prisma.taiKhoan.create({
            data: {
                IdVaiTro: userRole.IdVaiTro,
                TenDangNhap,
                MatKhau: hashedPassword,
                HoTen,
                Email,
                FirebaseUID: firebaseUid,
                IsVerified: false,
                TrangThai: true 
            },
            include: { vaiTro: true },
        });

        res.json({
            message: "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.",
            user: {
                IdTaiKhoan: newUser.IdTaiKhoan.toString(),
                Email: newUser.Email
            }
        });
    } catch (error: any) {
        console.error("Register error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const { TenDangNhap, MatKhau } = req.body;

        if (!TenDangNhap || !MatKhau) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
        }

        const user = await prisma.taiKhoan.findUnique({
            where: { TenDangNhap },
            include: { vaiTro: true },
        });

        if (!user || !(await bcrypt.compare(MatKhau, user.MatKhau))) {
            return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng" });
        }

        if (user.IdVaiTro !== BigInt(1)) {
            
            if (!user.IsVerified) {
                return res.status(403).json({
                    error: "Tài khoản chưa được kích hoạt qua Email",
                    unverified: true,
                    email: user.Email
                });
            }

            if (!user.TrangThai) {
                return res.status(403).json({ error: "Tài khoản của bạn đã bị khóa bởi quản trị viên" });
            }
        }

        const token = jwt.sign(
            { userId: user.IdTaiKhoan.toString(), userRole: user.vaiTro.TenVaiTro },
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
        res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
    }
});

router.post("/sync-verify", async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        await prisma.taiKhoan.update({
            where: { Email: email },
            data: { IsVerified: true }
        });
        res.json({ success: true, message: "Đã cập nhật trạng thái xác thực" });
    } catch (error: any) {
        res.status(500).json({ error: "Không thể đồng bộ trạng thái: " + error.message });
    }
});

router.put("/change-password", async (req: Request, res: Response) => {
    try {
        const { IdTaiKhoan, MatKhauCu, MatKhauMoi } = req.body;
        const authHeader = req.headers.authorization;

        if (!IdTaiKhoan || !MatKhauCu || !MatKhauMoi) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
        }

        const token = authHeader?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ error: "Unauthorized" });
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        if (decoded.userId !== IdTaiKhoan.toString()) {
            return res.status(403).json({ error: "Bạn không có quyền thực hiện hành động này" });
        }

        const user = await prisma.taiKhoan.findUnique({
            where: { IdTaiKhoan: BigInt(IdTaiKhoan) },
        });

        if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

        const isMatch = await bcrypt.compare(MatKhauCu, user.MatKhau);
        if (!isMatch) {
            return res.status(400).json({ error: "Mật khẩu cũ không chính xác" });
        }

        if (MatKhauMoi.length < 6) {
            return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const hashedNewPassword = await bcrypt.hash(MatKhauMoi, 10);
        await prisma.taiKhoan.update({
            where: { IdTaiKhoan: BigInt(IdTaiKhoan) },
            data: { MatKhau: hashedNewPassword },
        });

        res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error: any) {
        res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
    }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
    try {
        const { Email } = req.body;
        if (!Email) return res.status(400).json({ error: "Vui lòng nhập Email" });

        const user = await prisma.taiKhoan.findUnique({ where: { Email } });
        if (!user) return res.status(404).json({ error: "Email không tồn tại" });

        const newRawPassword = "KRA-" + crypto.randomInt(1000000, 9999999);

        const hashedPassword = await bcrypt.hash(newRawPassword, 10);

        await prisma.taiKhoan.update({
            where: { Email },
            data: { MatKhau: hashedPassword }
        });

        await sendForgotPasswordEmail(Email, newRawPassword);

        res.json({ message: "Mật khẩu mới đã được gửi vào Email của bạn!" });
    } catch (error: any) {
        res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
    }
});

router.get("/me", async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const user = await prisma.taiKhoan.findUnique({
            where: { IdTaiKhoan: BigInt(decoded.userId) },
            select: {
                IdTaiKhoan: true,
                TenDangNhap: true,
                HoTen: true,
                Email: true,
                IsVerified: true,
                TrangThai: true,
                NgayTao: true,
                vaiTro: { select: { TenVaiTro: true } },
            },
        });

        if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

        res.json({
            ...user,
            IdTaiKhoan: user.IdTaiKhoan.toString(),
            VaiTro: user.vaiTro.TenVaiTro,
        });
    } catch (error: any) {
        res.status(401).json({ error: "Phiên làm việc hết hạn" });
    }
});

export default router;