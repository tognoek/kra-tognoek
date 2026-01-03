"use client";
import { useEffect, useState } from "react";
import Prism from "prismjs";
// Sử dụng theme tối của Prism
import "prismjs/themes/prism-tomorrow.css"; 
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

interface CodeViewModalProps {
  code: string;
  language: string;
  onClose: () => void;
}

export default function CodeViewModal({ code, language, onClose }: CodeViewModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Lỗi khi copy: ", err);
    }
  };

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="code-modal-header">
          <div className="header-left">
            <span className="icon">📄</span>
            <span className="title">Mã nguồn bài nộp</span>
            <span className="lang-badge">{(language || "cpp").toUpperCase()}</span>
          </div>
          <div className="header-right">
            <button className={`copy-btn ${copied ? 'active' : ''}`} onClick={handleCopy}>
              {copied ? "✅ Đã chép" : "📋 Sao chép"}
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="code-modal-body">
          <pre className="line-numbers">
            <code className={`language-${language?.includes('cpp') ? 'cpp' : 'c'}`}>
              {code || "// Không có mã nguồn cho bài nộp này"}
            </code>
          </pre>
        </div>
      </div>

      <style jsx>{`
        .code-modal-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); /* Làm nền overlay tối hơn */
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; z-index: 3000; padding: 20px;
        }
        .code-modal-content {
          background: #1e1e1e; /* Nền tối */
          width: 100%; max-width: 1000px; max-height: 85vh;
          border-radius: 16px; display: flex; flex-direction: column; 
          overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
        }
        .code-modal-header {
          padding: 12px 20px; background: #2d2d2d; color: #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #3d3d3d;
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-right { display: flex; align-items: center; gap: 10px; }
        .title { font-weight: 600; font-size: 15px; color: #f8fafc; }
        .lang-badge { 
          background: #3b82f6; color: #ffffff; font-size: 10px; padding: 2px 8px; 
          border-radius: 4px; font-weight: 700; 
        }
        .copy-btn {
          font-size: 12px; padding: 6px 12px; border-radius: 6px;
          border: 1px solid #444; background: #333; cursor: pointer;
          transition: all 0.2s; font-weight: 600; color: #cbd5e1;
        }
        .copy-btn:hover { background: #444; border-color: #666; color: #fff; }
        .copy-btn.active { background: #064e3b; color: #34d399; border-color: #065f46; }
        
        .close-btn { 
          background: none; border: none; color: #94a3b8; 
          cursor: pointer; font-size: 20px; transition: 0.2s; line-height: 1;
        }
        .close-btn:hover { color: #f87171; }
        
        .code-modal-body { 
          flex: 1; overflow: auto; background: #1e1e1e; 
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .code-modal-body::-webkit-scrollbar {
          display: none;
        }

        pre { 
          margin: 0 !important; padding: 20px !important; font-size: 14px; 
          background: #1e1e1e !important; /* Đảm bảo trùng màu body */
        }
        code { 
          font-family: 'Fira Code', 'Consolas', monospace !important; 
          text-shadow: none !important; /* Loại bỏ đổ bóng chữ của Prism nếu có */
        }
      `}</style>
    </div>
  );
}