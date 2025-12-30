"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Login, 2: Verify, 3: Forgot
  const [TenDangNhap, setUsername] = useState("");
  const [MatKhau, setPassword] = useState("");
  const [emailForgot, setEmailForgot] = useState("");
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
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: emailForgot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("🚀 Mật khẩu mới đã được gửi về Email!");
      setStep(1); 
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const handleResendMail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      toast.info("📧 Đã gửi lại email xác thực!");
    }
  };

  return (
    <div className="login-wrapper">
      <ToastContainer position="top-right" />
      <style dangerouslySetInnerHTML={{ __html: authStyles }} />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">
              {step === 1 ? "👋 Chào mừng!" : step === 2 ? "🛡️ Kích hoạt" : "🔑 Quên mật khẩu"}
            </h1>
            <div className="login-subtitle">
              {step === 1 ? "Đăng nhập để tiếp tục thử thách" : 
               step === 2 ? `Xác thực email: ${unverifiedEmail}` : 
               "Nhập email để nhận mật khẩu mới"}
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="input-label">👤 Tên đăng nhập</label>
                <input className="styled-input" placeholder="Nhập username..." value={TenDangNhap} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="input-label">🔑 Mật khẩu</label>
                    <button type="button" className="forgot-link" onClick={() => setStep(3)}>Quên mật khẩu?</button>
                </div>
                <input className="styled-input" type="password" placeholder="••••••••" value={MatKhau} onChange={e => setPassword(e.target.value)} required />
              </div>
              {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? <span className="spinner"></span> : "🚀 Đăng nhập ngay"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                    <label className="input-label">📧 Email đã đăng ký</label>
                    <input className="styled-input" type="email" placeholder="email@example.com" value={emailForgot} onChange={e => setEmailForgot(e.target.value)} required />
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? <span className="spinner"></span> : "Gửi mật khẩu mới"}
                </button>
                <button type="button" className="back-to-login" onClick={() => setStep(1)}>⬅️ Quay lại đăng nhập</button>
            </form>
          )}

          {step === 2 && (
            <div className="verify-step">
              <div className="verify-icon">✉️</div>
              <p className="verify-text">Tài khoản cần xác thực email. Hãy nhấn vào link trong hộp thư của bạn.</p>
              <button onClick={() => window.location.reload()} className="login-button secondary">🔄 Tôi đã xác thực</button>
              <button onClick={handleResendMail} className="resend-link-btn">📩 Gửi lại email</button>
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
  .login-wrapper { min-height: 90vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', sans-serif; }
  .login-container { width: 100%; max-width: 480px; animation: slideUp 0.6s ease; }
  .login-card { background: white; padding: 48px 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; }
  .login-header { text-align: center; margin-bottom: 36px; }
  .login-title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
  .login-subtitle { color: #64748b; font-size: 14px; }
  .login-form { display: flex; flex-direction: column; gap: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .input-label { font-size: 13px; font-weight: 700; color: #475569; }
  .styled-input { width: 100%; padding: 14px 18px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 15px; outline: none; }
  .styled-input:focus { border-color: #2563eb; }
  .login-button { width: 100%; padding: 16px; background: #1e293b; color: white; border: none; border-radius: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; }
  .login-button:hover { background: #000; transform: translateY(-2px); }
  .login-button:disabled { opacity: 0.7; cursor: not-allowed; }
  .forgot-link { background: none; border: none; color: #2563eb; font-size: 13px; font-weight: 600; cursor: pointer; }
  .back-to-login { background: none; border: none; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 10px; }
  .message-banner { padding: 12px; border-radius: 12px; font-size: 13px; text-align: center; }
  .message-banner.error { background: #fff1f2; color: #be123c; }
  .verify-step { text-align: center; }
  .verify-icon { font-size: 50px; margin-bottom: 20px; }
  .resend-link-btn { background: none; border: none; color: #2563eb; font-weight: 700; cursor: pointer; margin-top: 20px; }
  .login-footer { text-align: center; margin-top: 32px; font-size: 14px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
  .register-link { color: #2563eb; font-weight: 700; text-decoration: none; }
  .spinner { width: 20px; height: 20px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;