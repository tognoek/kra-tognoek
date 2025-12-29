"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async () => {
      if (typeof document !== "undefined") {
        document.title = `Chào bạn!! - Kra tognoek`;
      }
    try {
      const res = await fetch(`${API_BASE}/api/posts/public?page=${page}`);
      const data = await res.json();
      setPosts(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Lỗi fetch posts:", error);
    }
  };

  useEffect(() => { fetchPosts(); }, [page]);

  return (
    <div className="home-wrapper">
      <div className="news-container">
        <h2 className="news-heading">📢 Thông báo mới</h2>
        
        <div className="posts-stack">
          {posts.map(post => (
            <div key={post.IdBaiDang} className="post-item-glass">
              {/* HEADER: Tiêu đề và Ghim */}
              <div className="post-header">
                <div className="post-title-row">
                  {post.UuTien > 5 && <span className="pin-badge">📌 GHIM</span>}
                  <h3 className="post-title-text">{post.TieuDe}</h3>
                </div>
                
                {/* AUTHOR & TIME INFO */}
                <div className="author-meta">
                  <div className="author-avatar-box">
                    <img 
                      src={post.taiKhoan?.Avatar || "/default-avatar.png"} 
                      alt="avatar" 
                      className="author-img" 
                    />
                  </div>
                  <div className="author-text">
                    <span className="author-name">{post.taiKhoan?.HoTen}</span>
                    <span className="post-date">
                      đã đăng vào {new Date(post.NgayCapNhat).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {post.NoiDung}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        {/* PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="pagination-posts">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="p-btn"
            >
              « Trang trước
            </button>
            <div className="p-indicator">Trang <b>{page}</b> / {totalPages}</div>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)} 
              className="p-btn"
            >
              Trang sau »
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .home-wrapper { max-width: 900px; margin: 0 auto; padding: 20px; }
        .section-title { font-size: 32px; font-weight: 900; color: #1e293b; margin-bottom: 40px; text-align: center; }
        
        .news-container { margin-top: 20px; }
        .news-heading { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }

        .post-item-glass {
          background: #ffffff;
          padding: 28px;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          margin-bottom: 30px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01);
          transition: all 0.3s ease;
        }
        .post-item-glass:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
          border-color: #e2e8f0;
        }

        /* Title Style */
        .post-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .post-title-text { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.4; }
        .pin-badge { 
          background: #fff1f2; color: #e11d48; font-size: 10px; font-weight: 800; 
          padding: 4px 8px; border-radius: 6px; border: 1px solid #ffe4e6; 
        }

        /* Author Style */
        .author-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #f1f5f9; }
        .author-avatar-box { width: 36px; height: 36px; border-radius: 10px; overflow: hidden; background: #f8fafc; flex-shrink: 0; border: 1px solid #e2e8f0; }
        .author-img { width: 100%; height: 100%; object-fit: cover; }
        .author-text { display: flex; flex-direction: column; }
        .author-name { font-size: 14px; font-weight: 700; color: #2563eb; }
        .post-date { font-size: 12px; color: #94a3b8; }

        /* Markdown Style */
        .markdown-body { 
          font-size: 15px; line-height: 1.8; color: #334155; 
        }
        .markdown-body :global(p) { margin-bottom: 16px; }
        .markdown-body :global(h1) { font-size: 1.5rem; font-weight: 800; margin-top: 24px; }
        .markdown-body :global(code) { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #e11d48; }

        /* Pagination Style */
        .pagination-posts { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 40px; padding-bottom: 40px; }
        .p-btn { 
          padding: 8px 20px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; 
          cursor: pointer; font-size: 14px; font-weight: 600; color: #475569; transition: 0.2s;
        }
        .p-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .p-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .p-indicator { font-size: 14px; color: #64748b; }
        .p-indicator b { color: #0f172a; }

        @media (max-width: 600px) {
          .post-item-glass { padding: 20px; }
          .post-title-text { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}