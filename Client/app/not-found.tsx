"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="not-found-wrapper">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <div className="error-illustration">🚀</div>
        
        <h1 className="error-title">Trang này đã bay mất!</h1>
        <p className="error-message">
          Có vẻ như đường dẫn bạn đang truy cập không tồn tại hoặc đã được chuyển sang một thiên hà khác.
        </p>

        <div className="error-actions">
          <button onClick={() => router.back()} className="btn-back">
            Quay lại trang trước
          </button>
        </div>
      </div>

      <style jsx>{`
        .not-found-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }
        .not-found-content {
          text-align: center;
          max-width: 500px;
          background: white;
          padding: 60px 40px;
          border-radius: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #f1f5f9;
        }
        .error-code {
          font-size: 8rem;
          font-weight: 900;
          color: #e2e8f0;
          line-height: 1;
          margin-bottom: -40px;
          user-select: none;
        }
        .error-illustration {
          font-size: 64px;
          margin-bottom: 24px;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .error-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 12px;
        }
        .error-message {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .btn-home {
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.2s;
        }
        .btn-home:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }
        .btn-back {
          background: #f1f5f9;
          color: #64748b;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-back:hover {
          background: #e2e8f0;
        }
        @media (max-width: 480px) {
          .error-actions { flex-direction: column; }
          .btn-home, .btn-back { width: 100%; }
        }
      `}</style>
    </div>
  );
}