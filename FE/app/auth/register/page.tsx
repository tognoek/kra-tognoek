"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface FieldErrors {
  TenDangNhap?: string;
  MatKhau?: string;
  HoTen?: string;
  Email?: string;
  general?: string;
}

export default function RegisterPage() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Đăng ký - OJ Portal";
    }
  }, []);

  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [HoTen, setFullname] = useState("");
  const [Email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string | null => {
    if (name === "TenDangNhap") {
      if (!value.trim()) return "Tên đăng nhập không được để trống";
      if (value.length < 3) return "Tên đăng nhập phải có ít nhất 3 ký tự";
      if (value.length > 50) return "Tên đăng nhập không được vượt quá 50 ký tự";
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới";
    }
    if (name === "MatKhau") {
      if (!value) return "Mật khẩu không được để trống";
      if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
      if (value.length > 100) return "Mật khẩu không được vượt quá 100 ký tự";
    }
    if (name === "HoTen") {
      if (!value.trim()) return "Họ tên không được để trống";
      if (value.trim().length < 2) return "Họ tên phải có ít nhất 2 ký tự";
      if (value.length > 50) return "Họ tên không được vượt quá 50 ký tự";
    }
    if (name === "Email") {
      if (!value.trim()) return "Email không được để trống";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Email không hợp lệ";
      if (value.length > 255) return "Email không được vượt quá 255 ký tự";
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const value = name === "TenDangNhap" ? TenDangNhap : 
                  name === "MatKhau" ? MatKhau :
                  name === "HoTen" ? HoTen : Email;
    const error = validateField(name, value);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name as keyof FieldErrors];
      setErrors(newErrors);
    }
  };

  const handleChange = (name: string, value: string) => {
    if (errors[name as keyof FieldErrors]) {
      const newErrors = { ...errors };
      delete newErrors[name as keyof FieldErrors];
      setErrors(newErrors);
    }

    if (name === "TenDangNhap") setUsername(value);
    else if (name === "MatKhau") setPassword(value);
    else if (name === "HoTen") setFullname(value);
    else if (name === "Email") setEmail(value);
  };

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};
    
    const usernameError = validateField("TenDangNhap", TenDangNhap);
    if (usernameError) newErrors.TenDangNhap = usernameError;

    const passwordError = validateField("MatKhau", MatKhau);
    if (passwordError) newErrors.MatKhau = passwordError;

    const fullnameError = validateField("HoTen", HoTen);
    if (fullnameError) newErrors.HoTen = fullnameError;

    const emailError = validateField("Email", Email);
    if (emailError) newErrors.Email = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    if (!validateForm()) {
      setMessage("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          TenDangNhap, 
          MatKhau, 
          HoTen: HoTen.trim(), 
          Email: Email.trim() 
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        const errorMessage = data?.error || "Đăng ký thất bại";
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

      setMessage("✅ Đăng ký thành công! Bạn sẽ được chuyển về trang chủ...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      setMessage("Lỗi kết nối. Vui lòng thử lại sau");
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
          <div className="label">
            Tên đăng nhập <span style={{ color: "#c62828" }}>*</span>
          </div>
          <input
            className={`input ${errors.TenDangNhap ? "input-error" : ""}`}
            value={TenDangNhap}
            onChange={(e) => handleChange("TenDangNhap", e.target.value)}
            onBlur={() => handleBlur("TenDangNhap")}
            required
            placeholder="vd: user123"
          />
          {errors.TenDangNhap && touched.TenDangNhap && (
            <div style={{ color: "#c62828", fontSize: "12px", marginTop: "4px" }}>
              {errors.TenDangNhap}
            </div>
          )}
          {!errors.TenDangNhap && TenDangNhap && (
            <div style={{ fontSize: "12px", marginTop: "4px", color: "#666" }}>
              Chỉ được chứa chữ cái, số và dấu gạch dưới (_)
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
          {MatKhau && !errors.MatKhau && (
            <div style={{ fontSize: "12px", marginTop: "4px", color: MatKhau.length >= 8 ? "#2e7d32" : "#666" }}>
              {MatKhau.length < 8 ? "💡 Mật khẩu nên có ít nhất 8 ký tự để bảo mật hơn" : "✓ Mật khẩu hợp lệ"}
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="label">
            Họ tên <span style={{ color: "#c62828" }}>*</span>
          </div>
          <input
            className={`input ${errors.HoTen ? "input-error" : ""}`}
            value={HoTen}
            onChange={(e) => handleChange("HoTen", e.target.value)}
            onBlur={() => handleBlur("HoTen")}
            required
            placeholder="Họ và tên"
          />
          {errors.HoTen && touched.HoTen && (
            <div style={{ color: "#c62828", fontSize: "12px", marginTop: "4px" }}>
              {errors.HoTen}
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="label">
            Email <span style={{ color: "#c62828" }}>*</span>
          </div>
          <input
            className={`input ${errors.Email ? "input-error" : ""}`}
            type="email"
            value={Email}
            onChange={(e) => handleChange("Email", e.target.value)}
            onBlur={() => handleBlur("Email")}
            required
            placeholder="email@example.com"
          />
          {errors.Email && touched.Email && (
            <div style={{ color: "#c62828", fontSize: "12px", marginTop: "4px" }}>
              {errors.Email}
            </div>
          )}
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
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
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="problem-link">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
