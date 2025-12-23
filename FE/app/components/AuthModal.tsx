"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

type Mode = "login" | "register";

interface Props {
  open: boolean;
  mode: Mode;
  onClose: () => void;
}

interface FieldErrors {
  TenDangNhap?: string;
  MatKhau?: string;
  HoTen?: string;
  Email?: string;
  general?: string;
}

export default function AuthModal({ open, mode: initialMode, onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [HoTen, setFullname] = useState("");
  const [Email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isRegister = mode === "register";

  // Reset form khi đóng modal hoặc chuyển mode
  useEffect(() => {
    if (!open) {
      setUsername("");
      setPassword("");
      setFullname("");
      setEmail("");
      setMessage(null);
      setErrors({});
      setTouched({});
    }
  }, [open]);

  useEffect(() => {
    setMode(initialMode);
    setMessage(null);
    setErrors({});
  }, [initialMode]);

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
    if (name === "HoTen" && isRegister) {
      if (!value.trim()) return "Họ tên không được để trống";
      if (value.trim().length < 2) return "Họ tên phải có ít nhất 2 ký tự";
      if (value.length > 50) return "Họ tên không được vượt quá 50 ký tự";
    }
    if (name === "Email" && isRegister) {
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
    // Clear error khi user bắt đầu nhập lại
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

    if (isRegister) {
      const fullnameError = validateField("HoTen", HoTen);
      if (fullnameError) newErrors.HoTen = fullnameError;

      const emailError = validateField("Email", Email);
      if (emailError) newErrors.Email = emailError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    // Validate form
    if (!validateForm()) {
      setMessage("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    setLoading(true);
    try {
      const url =
        mode === "login"
          ? `${API_BASE}/api/auth/login`
          : `${API_BASE}/api/auth/register`;
      const body: any = { TenDangNhap, MatKhau };
      if (isRegister) {
        body.HoTen = HoTen.trim();
        body.Email = Email.trim();
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Xử lý lỗi từ server
        const errorMessage = data?.error || "Thao tác thất bại";
        const errorField = data?.field || "general";
        
        if (errorField === "general") {
          setMessage(errorMessage);
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

      if (isRegister) {
        setMessage("✅ Đăng ký thành công! Đang chuyển về trang chủ...");
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 1500);
      } else {
        setMessage("✅ Đăng nhập thành công!");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setMessage(err.message || "Lỗi kết nối. Vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

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
                setMessage(null);
                setErrors({});
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`tab ${isRegister ? "tab-active" : ""}`}
              onClick={() => {
                setMode("register");
                setMessage(null);
                setErrors({});
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
            {isRegister && MatKhau && !errors.MatKhau && (
              <div style={{ fontSize: "12px", marginTop: "4px", color: "#666" }}>
                {MatKhau.length < 8 ? "💡 Mật khẩu nên có ít nhất 8 ký tự để bảo mật hơn" : "✓ Mật khẩu hợp lệ"}
              </div>
            )}
          </div>

          {isRegister && (
            <>
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
            </>
          )}

          <button 
            type="submit" 
            className="button" 
            disabled={loading} 
            style={{ borderRadius: 10 }}
          >
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
