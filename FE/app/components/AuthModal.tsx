"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Mode = "login" | "register";

interface Props {
  open: boolean;
  mode: Mode;
  onClose: () => void;
}

export default function AuthModal({ open, mode: initialMode, onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [HoTen, setFullname] = useState("");
  const [Email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!open) return null;

  const isRegister = mode === "register";

  const resetMessage = () => setMessage(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessage();
    setLoading(true);
    try {
      const url =
        mode === "login"
          ? `${API_BASE}/api/auth/login`
          : `${API_BASE}/api/auth/register`;
      const body: any = { TenDangNhap, MatKhau };
      if (isRegister) {
        body.HoTen = HoTen;
        body.Email = Email;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Thao tác thất bại");

      if (typeof window !== "undefined") {
        window.localStorage.setItem("oj_token", data.token);
        window.localStorage.setItem("oj_user", JSON.stringify(data.user));
      }

      setMessage("✅ Thành công! Đang đóng cửa sổ...");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setMessage(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-animate" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-tabs">
            <button
              type="button"
              className={`tab ${!isRegister ? "tab-active" : ""}`}
              onClick={() => {
                setMode("login");
                resetMessage();
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`tab ${isRegister ? "tab-active" : ""}`}
              onClick={() => {
                setMode("register");
                resetMessage();
              }}
            >
              Đăng ký
            </button>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-grid" style={{ marginTop: 8 }}>
          <div className="form-group">
            <div className="label">Tên đăng nhập</div>
            <input
              className="input"
              value={TenDangNhap}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="vd: admin"
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

          {isRegister && (
            <>
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
            </>
          )}

          <button type="submit" className="button" disabled={loading} style={{ borderRadius: 10 }}>
            {loading
              ? isRegister
                ? "Đang đăng ký..."
                : "Đang đăng nhập..."
              : isRegister
              ? "Đăng ký"
              : "Đăng nhập"}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: 12,
              padding: "12px",
              borderRadius: "4px",
              background: message.startsWith("✅") ? "#e8f5e9" : "#ffebee",
              color: message.startsWith("✅") ? "#2e7d32" : "#c62828",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}


