"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LoginPage() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Đăng nhập - OJ Portal";
    }
  }, []);

  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ TenDangNhap?: string; MatKhau?: string; general?: string }>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string | null => {
    if (name === "TenDangNhap") {
      if (!value.trim()) return "Tên đăng nhập không được để trống";
    }
    if (name === "MatKhau") {
      if (!value) return "Mật khẩu không được để trống";
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const value = name === "TenDangNhap" ? TenDangNhap : MatKhau;
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name as keyof typeof errors];
      setErrors(newErrors);
    }
  };

  const handleChange = (name: string, value: string) => {
    if (errors[name as keyof typeof errors]) {
      const newErrors = { ...errors };
      delete newErrors[name as keyof typeof errors];
      setErrors(newErrors);
    }

    if (name === "TenDangNhap") setUsername(value);
    else if (name === "MatKhau") setPassword(value);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!TenDangNhap.trim()) {
      newErrors.TenDangNhap = "Tên đăng nhập không được để trống";
    }
    if (!MatKhau) {
      newErrors.MatKhau = "Mật khẩu không được để trống";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    if (!validateForm()) {
      setMessage("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenDangNhap, MatKhau }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        const errorMessage = data?.error || "Đăng nhập thất bại";
        const errorField = data?.field || "general";
        
        if (errorField === "general") {
          setMessage(errorMessage);
          setErrors({ general: errorMessage });
        } else {
          setErrors({ [errorField]: errorMessage });
          setMessage(errorMessage);
        }
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("oj_token", data.token);
        window.localStorage.setItem("oj_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("authChange"));
      }

      setMessage("✅ Đăng nhập thành công! Bạn sẽ được chuyển về trang chủ...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err: any) {
      setMessage("Lỗi kết nối. Vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">Đăng nhập</h1>
      <p className="section-sub">Sử dụng tài khoản đã đăng ký để tiếp tục.</p>

      <form onSubmit={onSubmit} className="form-card form-grid">
        <div className="form-group">
          <div className="label">
            Tên đăng nhập <span style={{ color: "#c62828" }}>*</span>
          </div>
          <input
            className={`input ${errors.TenDangNhap ? "input-error" : ""}`}
            value={TenDangNhap}
            onChange={(e) => handleChange("TenDangNhap", e.target.value)}
            onBlur={() => handleBlur("TenDangNhap")}
            required
            placeholder="vd: admin"
          />
          {errors.TenDangNhap && touched.TenDangNhap && (
            <div style={{ color: "#c62828", fontSize: "12px", marginTop: "4px" }}>
              {errors.TenDangNhap}
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="label">
            Mật khẩu <span style={{ color: "#c62828" }}>*</span>
          </div>
          <input
            className={`input ${errors.MatKhau ? "input-error" : ""}`}
            type="password"
            value={MatKhau}
            onChange={(e) => handleChange("MatKhau", e.target.value)}
            onBlur={() => handleBlur("MatKhau")}
            required
            placeholder="••••••"
          />
          {errors.MatKhau && touched.MatKhau && (
            <div style={{ color: "#c62828", fontSize: "12px", marginTop: "4px" }}>
              {errors.MatKhau}
            </div>
          )}
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "4px",
              background: message.includes("✅") || message.includes("thành công") ? "#e8f5e9" : "#ffebee",
              color: message.includes("✅") || message.includes("thành công") ? "#2e7d32" : "#c62828",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {errors.general && (
          <div
            style={{
              padding: "12px",
              borderRadius: "4px",
              background: "#ffebee",
              color: "#c62828",
              fontWeight: 600,
            }}
          >
            {errors.general}
          </div>
        )}
      </form>

      <p style={{ marginTop: 16 }}>
        Chưa có tài khoản?{" "}
        <Link href="/auth/register" className="problem-link">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
