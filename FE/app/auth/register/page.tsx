"use client";

import { useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function RegisterPage() {
  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [HoTen, setFullname] = useState("");
  const [Email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenDangNhap, MatKhau, HoTen, Email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Đăng ký thất bại");

      if (typeof window !== "undefined") {
        window.localStorage.setItem("oj_token", data.token);
        window.localStorage.setItem("oj_user", JSON.stringify(data.user));
      }

      setMessage("Đăng ký thành công! Bạn sẽ được chuyển về trang chủ...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err: any) {
      setMessage(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">Đăng ký</h1>
      <p className="section-sub">Tạo tài khoản mới để luyện tập và tham gia contest.</p>

      <form onSubmit={onSubmit} className="form-card form-grid">
        <div className="form-group">
          <div className="label">Tên đăng nhập</div>
          <input
            className="input"
            value={TenDangNhap}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="vd: user123"
          />
        </div>
        <div className="form-group">
          <div className="label">Mật khẩu</div>
          <input
            className="input"
            type="password"
            value={MatKhau}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••"
          />
        </div>
        <div className="form-group">
          <div className="label">Họ tên</div>
          <input
            className="input"
            value={HoTen}
            onChange={(e) => setFullname(e.target.value)}
            required
            placeholder="Họ và tên"
          />
        </div>
        <div className="form-group">
          <div className="label">Email</div>
          <input
            className="input"
            type="email"
            value={Email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
          />
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "4px",
              background: message.includes("thành công") ? "#e8f5e9" : "#ffebee",
              color: message.includes("thành công") ? "#2e7d32" : "#c62828",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}
      </form>

      <p style={{ marginTop: 16 }}>
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="problem-link">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}


