"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import 'highlight.js/styles/github.css'; 
import 'katex/dist/katex.min.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [topStats, setTopStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    if (typeof document !== "undefined") {
      document.title = `Chào bạn!! - Kra tognoek`;
    }
    try {
      const postRes = await fetch(`${API_BASE}/api/posts/public?page=${page}`);
      const postData = await postRes.json();
      setPosts(postData.items);
      setTotalPages(postData.totalPages);

      const statsRes = await fetch(`${API_BASE}/api/home`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTopStats(statsData);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, [page]);

  return (
    <div className="home-layout">
      <style jsx>{homeStyles}</style>
      
      <div className="main-content">
        <div className="posts-stack">
          {posts.map(post => (
            <div key={post.IdBaiDang} className="post-item-glass">
              <div className="post-header">
                <div className="post-title-row">
                  {post.UuTien > 5 && <span className="pin-badge">📌 GHIM</span>}
                  <h3 className="post-title-text">{post.TieuDe}</h3>
                </div>
                <div className="author-meta">
                  <div className="author-avatar-box">
                    <img src={post.taiKhoan?.Avatar} alt="avatar" className="author-img" />
                  </div>
                  <div className="author-text">
                    <Link href={`/users/${post?.IdTaiKhoan}`} className="author-name">{post.taiKhoan?.HoTen}</Link>
                    <span className="post-date"> đã đăng vào {new Date(post.NgayCapNhat).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <div className="markdown-view markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}>
                  {post.NoiDung}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-posts">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-btn">« Trước</button>
            <div className="p-indicator">Trang <b>{page}</b> / {totalPages}</div>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-btn">Sau »</button>
          </div>
        )}
      </div>

      <aside className="sidebar">
        {/* WIDGET TOP USERS */}
        <div className="widget-card">
          <h3 className="widget-title">🏆 Top Cày Cuốc</h3>
          <div className="rank-list">
            {topStats?.users.map((u: any, idx: number) => (
              <div key={u.id} className={`rank-item ${idx >= 3 ? 'rank-item-small' : ''}`}>
                <div className={`rank-badge ${idx < 3 ? `rank-tier-${idx + 1}` : 'rank-normal'}`}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </div>
                <img src={u.avatar} className="rank-avatar" alt="" />
                <div className="rank-info">
                  <Link href={`/users/${u.id}`} className="rank-name">{u.name}</Link>
                  <div className="rank-val">{u.acCount} AC</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET TOP PROBLEMS */}
        <div className="widget-card">
          <h3 className="widget-title">⭐ Bài Tập Hot</h3>
          <div className="rank-list">
            {topStats?.problems.map((p: any, idx: number) => (
              <div key={p.id} className={`rank-item ${idx >= 3 ? 'rank-item-small' : ''}`}>
                <div className={`rank-badge ${idx < 3 ? 'rank-icon-hot' : 'rank-normal'}`}>
                  {idx === 0 ? "👑" : idx === 1 ? "💥" : idx === 2 ? "🎯" : idx + 1}
                </div>
                <div className="rank-info">
                  <Link href={`/problems/${p.id}`} className="rank-link-title">{p.title}</Link>
                  <div className="rank-val">{p.acCount} AC</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

const homeStyles = `
  .home-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  /* Post Style */
  .post-item-glass {
    background: white;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid #f1f5f9;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  }
  .post-title-text { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; }
  .pin-badge { background: #fff1f2; color: #e11d48; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
  .author-meta { display: flex; align-items: center; gap: 12px; margin: 16px 0; padding-bottom: 16px; border-bottom: 1px dashed #f1f5f9; }
  .author-avatar-box { width: 34px; height: 34px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
  .author-img { width: 100%; height: 100%; object-fit: cover; }
  .author-name { font-size: 13px; font-weight: 700; color: #2563eb; }
  .post-date { font-size: 11px; color: #94a3b8; }
  .markdown-body code { background: rgba(235, 235, 235, 0.64); color: #2563eb; padding: 0.2em 0.4em; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 90%; }
  .markdown-body pre { background: #f5f5f5ff; color: #f8fafc; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 20px 0; }
  .markdown-body pre code { background: none; color: black; padding: 0; }
  /* Sidebar */
  .sidebar { display: flex; flex-direction: column; gap: 24px; }
  .widget-card {
    background: white;
    padding: 20px;
    border-radius: 24px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.03);
  }
  .widget-title { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 18px; }

  .rank-list { display: flex; flex-direction: column; gap: 12px; }
  
  /* Hạng Top 3 */
  .rank-item { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    padding: 10px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid transparent;
    transition: 0.2s;
  }
  .rank-item:hover { border-color: #e2e8f0; background: #fff; }

  /* Hạng từ 4 trở đi */
  .rank-item-small {
    padding: 6px 10px;
    background: transparent;
    border: 1px solid #f1f5f9;
  }
  .rank-item-small .rank-avatar { width: 28px; height: 28px; }
  .rank-item-small .rank-name, .rank-item-small .rank-link-title { font-size: 12px; font-weight: 600; }

  .rank-badge {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .rank-normal {
    font-size: 12px;
    font-weight: 800;
    color: #94a3b8;
    background: #f1f5f9;
    border-radius: 8px;
    width: 24px;
    height: 24px;
  }
  
  .rank-tier-1 { filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.5)); transform: scale(1.15); }

  .rank-avatar { 
    width: 36px; 
    height: 36px; 
    border-radius: 10px; 
    object-fit: cover; 
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .rank-info { flex: 1; min-width: 0; }
  .rank-name { font-size: 14px; font-weight: 700; color: #1e293b; text-decoration: none; }
  .rank-link-title { 
    font-size: 13px; 
    font-weight: 700; 
    color: #334155; 
    text-decoration: none; 
    display: block; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap; 
  }
  .rank-link-title:hover, .rank-name:hover { color: #2563eb; }
  .rank-val { font-size: 11px; color: #64748b; font-weight: 600; }

  /* Pagination */
  .pagination-posts { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 20px 0; }
  .p-btn { padding: 6px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 13px; font-weight: 600; }
  .p-btn:disabled { opacity: 0.5; }

  @media (max-width: 900px) {
    .home-layout { grid-template-columns: 1fr; }
    .sidebar { order: -1; }
  }
`;