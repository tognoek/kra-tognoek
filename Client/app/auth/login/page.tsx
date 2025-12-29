"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | null }>({ text: "", type: null });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: null });

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenDangNhap, MatKhau }),
      });
      const data = await res.json();

      if (res.status === 403 && data.unverified) {
        setUnverifiedEmail(data.email);
        const fbCredential = await signInWithEmailAndPassword(auth, data.email, MatKhau);
        
        if (fbCredential.user.emailVerified) {
          await fetch(`${API_BASE}/api/auth/sync-verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.email }),
          });
          return handleLogin(e);
        } else {
          setStep(2);
          return;
        }
      }

      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("oj_token", data.token);
      localStorage.setItem("oj_user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err: any) {
      setMessage({ text: "❌ " + (err.message || "Đăng nhập thất bại"), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendMail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      alert("📧 Đã gửi lại email xác thực!");
    }
  };

  return (
    <div className="login-wrapper">
      <style dangerouslySetInnerHTML={{ __html: authStyles }} />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">
              {step === 1 ? "👋 Chào mừng!" : "🛡️ Kích hoạt"}
            </h1>
            {/* ĐÃ SỬA: Chuyển thẻ <p> thành <div> để tránh lỗi Hydration */}
            <div className="login-subtitle">
              {step === 1 ? (
                "Đăng nhập để tiếp tục thử thách"
              ) : (
                <>
                  Vui lòng xác thực email:
                  <div className="email-highlight">{unverifiedEmail}</div>
                </>
              )}
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="input-label">👤 Tên đăng nhập</label>
                <input className="styled-input" placeholder="Nhập username..." value={TenDangNhap} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="input-label">🔑 Mật khẩu</label>
                <input className="styled-input" type="password" placeholder="••••••••" value={MatKhau} onChange={e => setPassword(e.target.value)} required />
              </div>
              {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? <span className="spinner"></span> : "🚀 Đăng nhập ngay"}
              </button>
            </form>
          ) : (
            <div className="verify-step">
              <div className="verify-icon">✉️</div>
              <p className="verify-text">
                Tài khoản của bạn cần bước xác thực cuối cùng. Hãy nhấn vào link trong email chúng tôi vừa gửi.
              </p>
              
              <div className="verify-action-group">
                <button onClick={() => window.location.reload()} className="login-button secondary">
                  🔄 Tôi đã xác thực, thử lại
                </button>
                <button onClick={handleResendMail} className="resend-link">
                  📩 Gửi lại email xác thực
                </button>
              </div>
            </div>
          )}

          <div className="login-footer">
            <span>Chưa có tài khoản? </span>
            <Link href="/auth/register" className="register-link">✨ Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const authStyles = `
  /* Giữ nguyên phần CSS đã tối ưu của lượt trước */
  .login-wrapper { min-height: 90vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', system-ui, sans-serif; }
  .login-container { width: 100%; max-width: 480px; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
  .login-card { background: white; padding: 48px 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9; }
  .login-header { text-align: center; margin-bottom: 36px; }
  .login-title { font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
  .login-subtitle { color: #64748b; font-size: 15px; line-height: 1.6; }
  .email-highlight { color: #2563eb; font-weight: 700; margin-top: 4px; font-size: 16px; }
  .login-form { display: flex; flex-direction: column; gap: 24px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .input-label { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 0.025em; margin-left: 4px; }
  .styled-input { width: 100%; padding: 14px 18px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 15px; outline: none; transition: all 0.2s ease; }
  .styled-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); background-color: #fff; }
  .login-button { width: 100%; padding: 16px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25); }
  .login-button:hover { transform: translateY(-3px); filter: brightness(1.05); }
  .login-button.secondary { background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0; }
  .verify-step { text-align: center; }
  .resend-link { margin-top: 30px; background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 18px;}
  .verify-icon { font-size: 64px; margin-bottom: 24px; display: block; }
  .verify-text { color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 32px; }
  .message-banner { padding: 14px; border-radius: 14px; font-size: 14px; font-weight: 600; text-align: center; }
  .message-banner.error { background: #fff1f2; color: #be123c; border: 1px solid #ffe4e6; }
  .message-banner.success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
  .login-footer { text-align: center; margin-top: 40px; font-size: 14px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px; }
  .register-link { color: #2563eb; font-weight: 700; text-decoration: none; }
  .spinner { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
`;