"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ TenDangNhap: "", MatKhau: "", HoTen: "", Email: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | null }>({ text: "", type: null });

  const [mathQuiz, setMathQuiz] = useState({ q: "", a: 0 });
  const [userAnswer, setUserAnswer] = useState("");

  const generateMathQuiz = useCallback(() => {
    const operators = ["+", "-", "*"];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let n1 = Math.floor(Math.random() * 91) + 10; // 10 - 100
    let n2 = Math.floor(Math.random() * 91) + 10; // 10 - 100
    let answer = 0;

    switch (op) {
      case "+":
        answer = n1 + n2;
        break;
      case "-":
        if (n1 < n2) [n1, n2] = [n2, n1];
        answer = n1 - n2;
        break;
      case "*":
        n1 = Math.floor(Math.random() * 11) + 2;
        n2 = Math.floor(Math.random() * 11) + 2;
        answer = n1 * n2;
        break;
    }

    setMathQuiz({ q: `${n1} ${op} ${n2} = ?`, a: answer });
    setUserAnswer("");
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "Đăng ký - Kra Tognoek";
    generateMathQuiz();
  }, [generateMathQuiz]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseInt(userAnswer) !== mathQuiz.a) {
      setMessage({ text: "❌ Đáp án phép tính chưa chính xác!", type: "error" });
      generateMathQuiz();
      return;
    }
    
    setLoading(true);
    setMessage({ text: "", type: null });

    try {
      const checkRes = await fetch(`${API_BASE}/api/auth/check-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenDangNhap: formData.TenDangNhap, Email: formData.Email }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error);

      const fbCredential = await createUserWithEmailAndPassword(auth, formData.Email, formData.MatKhau);
      await sendEmailVerification(fbCredential.user);

      const saveRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, firebaseUid: fbCredential.user.uid }),
      });

      if (saveRes.ok) {
        await signOut(auth);
        setStep(2);
      } else {
        const saveData = await saveRes.json();
        throw new Error(saveData.error);
      }
    } catch (err: any) {
      setMessage({ text: "❌ " + (err.message || "Đăng ký thất bại"), type: "error" });
      generateMathQuiz();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style dangerouslySetInnerHTML={{ __html: authStyles }} />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">
              {step === 1 ? "✨ Tạo tài khoản" : "📧 Kiểm tra Email"}
            </h1>
            <p className="login-subtitle">
              {step === 1 
                ? "Gia nhập cộng đồng lập trình Kra Tognoek ngay hôm nay" 
                : `Hệ thống đã gửi liên kết xác thực đến ${formData.Email}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRegister} className="login-form">
              <div className="row-grid">
                <div className="form-group">
                  <label className="input-label">👤 Tên đăng nhập</label>
                  <input className="styled-input" placeholder="username..." onChange={e => setFormData({...formData, TenDangNhap: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="input-label">🪪 Họ tên</label>
                  <input className="styled-input" placeholder="Nguyễn Văn A" onChange={e => setFormData({...formData, HoTen: e.target.value})} required />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">✉️ Địa chỉ Email</label>
                <input className="styled-input" type="email" placeholder="example@gmail.com" onChange={e => setFormData({...formData, Email: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="input-label">🔒 Mật khẩu</label>
                <input className="styled-input" type="password" placeholder="••••••••" onChange={e => setFormData({...formData, MatKhau: e.target.value})} required />
              </div>

              <div className="captcha-section">
                <div className="captcha-header">
                  <label className="input-label">🤖 Xác thực con người</label>
                  <span className="quiz-text">{mathQuiz.q}</span>
                </div>
                <input 
                  className="styled-input" 
                  type="number"
                  placeholder="Nhập kết quả..." 
                  value={userAnswer} 
                  onChange={e => setUserAnswer(e.target.value)} 
                  required 
                />
              </div>

              {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}
              
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? <span className="spinner"></span> : "🚀 Đăng ký tài khoản"}
              </button>
            </form>
          ) : (
            <div className="verify-step">
              <div className="verify-icon">✉️</div>
              <p className="verify-text">Vui lòng nhấn vào đường link chúng tôi vừa gửi vào email của bạn để kích hoạt tài khoản.</p>
              <button onClick={() => window.location.href = "/auth/login"} className="login-button">
                👉 Đi tới Đăng nhập
              </button>
            </div>
          )}

          <div className="login-footer">
            <span>Đã có tài khoản? </span>
            <Link href="/auth/login" className="register-link">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const authStyles = `
  .login-wrapper { min-height: 90vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', system-ui, sans-serif; }
  .login-container { width: 100%; max-width: 520px; animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
  .login-card { background: white; padding: 28px 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); border: 1px solid #f1f5f9; }
  
  .login-header { text-align: center; margin-bottom: 32px; }
  .login-title { font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
  .login-subtitle { color: #64748b; font-size: 15px; line-height: 1.6; }
  
  .login-form { display: flex; flex-direction: column; gap: 20px; }
  .row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  
  .input-label { font-size: 13px; font-weight: 700; color: #475569; margin-left: 4px; display: flex; align-items: center; gap: 4px; }
  .styled-input { width: 100%; padding: 14px 18px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 15px; outline: none; transition: all 0.2s ease; }
  .styled-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
  
  .captcha-section { background: #f1f5f9; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
  .captcha-header { display: flex; justify-content: space-between; align-items: center; }
  .quiz-text { color: #2563eb; font-weight: 800; font-size: 18px; background: white; padding: 4px 12px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  
  .login-button { width: 100%; padding: 16px; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25); margin-top: 10px; }
  .login-button:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.3); }
  .login-button:disabled { opacity: 0.7; transform: none; }

  .message-banner { padding: 14px; border-radius: 14px; font-size: 14px; font-weight: 600; text-align: center; animation: fadeIn 0.3s ease; }
  .message-banner.error { background: #fff1f2; color: #be123c; border: 1px solid #ffe4e6; }
  .message-banner.success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }

  .verify-step { text-align: center; padding: 20px 0; }
  .verify-icon { font-size: 64px; margin-bottom: 20px; display: block; }
  .verify-text { color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 30px; }

  .login-footer { text-align: center; margin-top: 32px; font-size: 14px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px; }
  .register-link { color: #2563eb; font-weight: 700; text-decoration: none; margin-left: 4px; }
  
  .spinner { width: 22px; height: 22px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.8s linear infinite; display: inline-block; }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  @media (max-width: 480px) {
    .row-grid { grid-template-columns: 1fr; }
    .login-card { padding: 32px 24px; }
  }
`;