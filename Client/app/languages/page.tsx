"use client";

import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function LanguagesPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/languages`)
      .then(res => res.json())
      .then(d => {
        if (typeof document !== "undefined") {
          document.title = `Thống kê ngôn ngữ   - Kra tognoek`;
        }
        setData(d);
        setFiltered(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setFiltered(data.filter(l => 
      l.TenNgonNgu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.TenNhanDien?.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery, data]);

  if (loading) return <div className="loader">Đang tải dữ liệu...</div>;

  return (
    <div className="lang-container">
      <style dangerouslySetInnerHTML={{ __html: languageStyles }} />
      
      <div className="header-box">
        <h1 className="title">Ngôn ngữ lập trình</h1>
        <div className="search-wrapper">
          <input 
            type="text" 
            placeholder="Tìm kiếm ngôn ngữ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="grid-layout">
        {filtered.map((l) => {
          // Tính toán tỷ lệ thành công
          const successRate = l.totalSubmissions > 0 
            ? ((l.successfulSubmissions / l.totalSubmissions) * 100).toFixed(1) 
            : "0";
          
          // Xác định class cho Rank nổi bật
          const rankClass = l.rank === 1 ? "rank-gold" : l.rank === 2 ? "rank-silver" : l.rank === 3 ? "rank-bronze" : "";
          const rankIcon = l.rank === 1 ? "👑" : l.rank === 2 ? "🥈" : l.rank === 3 ? "🥉" : `#${l.rank}`;

          return (
            <div key={l.IdNgonNgu} className={`lang-card ${rankClass}`}>
              {/* Rank Badge nổi bật */}
              <div className={`rank-tag ${rankClass}`}>
                {rankIcon}
              </div>
              
              <div className="card-body">
                <div className="top-section">
                  <span className="code-id">{l.TenNhanDien}</span>
                  <StatusBadge status={l.TrangThai ? "Active" : "Disabled"} />
                </div>

                <h2 className="display-name">{l.TenNgonNgu}</h2>

                <div className="stats-grid">
                  <div className="stat-box success">
                    <span className="stat-val">{l.successfulSubmissions}</span>
                    <span className="stat-lbl">Thành công</span>
                  </div>
                  <div className="stat-box total">
                    <span className="stat-val">{l.totalSubmissions}</span>
                    <span className="stat-lbl">Bài nộp</span>
                  </div>
                  <div className="stat-box users">
                    <span className="stat-val">{l.uniqueUsers}</span>
                    <span className="stat-lbl">Thí sinh</span>
                  </div>
                </div>

                <div className="progress-container">
                    <div className="progress-label">
                        <span>Tỷ lệ thành công</span>
                        <span>{successRate}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${successRate}%` }}></div>
                    </div>
                </div>

                {l.totalSubmissions === 0 && (
                  <div className="unused-overlay">Chưa được sử dụng</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const languageStyles = `
  .lang-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  .header-box { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
  .title { font-size: 2.2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
  
  .search-wrapper { position: relative; }
  .search-wrapper input { padding: 12px 20px 12px 45px; border-radius: 12px; border: 1.5px solid #e2e8f0; width: 350px; outline: none; transition: all 0.2s; font-size: 0.95rem; }
  .search-wrapper input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
  .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; }

  .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }

  .lang-card { 
    background: white; 
    border-radius: 20px; 
    border: 1px solid #f1f5f9; 
    position: relative; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .lang-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }

  /* Rank Tag Styles */
  .rank-tag {
    position: absolute;
    top: -15px;
    left: 20px;
    background: #f8fafc;
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 800;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10;
    border: 1px solid #e2e8f0;
  }

  .rank-gold { border-color: #fbbf24 !important; background: linear-gradient(to bottom right, #fff, #fffbeb); }
  .rank-gold .rank-tag { background: #fbbf24; color: #78350f; border: none; font-size: 1.1rem; }

  .rank-silver { border-color: #94a3b8 !important; background: linear-gradient(to bottom right, #fff, #f8fafc); }
  .rank-silver .rank-tag { background: #94a3b8; color: #1e293b; border: none; font-size: 1.1rem; }

  .rank-bronze { border-color: #d97706 !important; background: linear-gradient(to bottom right, #fff, #fff7ed); }
  .rank-bronze .rank-tag { background: #d97706; color: #fff; border: none; font-size: 1.1rem; }

  .card-body { padding: 30px 24px 24px 24px; }
  
  .top-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .code-id { font-family: 'Fira Code', monospace; font-size: 0.8rem; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }
  
  .display-name { font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-bottom: 24px; }

  /* Stats Grid Colors */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .stat-box { display: flex; flex-direction: column; padding: 8px; border-radius: 10px; }
  .stat-val { font-size: 1.25rem; font-weight: 800; line-height: 1; }
  .stat-lbl { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 700; margin-top: 6px; letter-spacing: 0.025em; }

  .success .stat-val { color: #10b981; }
  .total .stat-val { color: #6366f1; }
  .users .stat-val { color: #f59e0b; }

  /* Progress Bar */
  .progress-container { margin-top: 15px; }
  .progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 6px; }
  .progress-bar-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: linear-gradient(to right, #10b981, #34d399); border-radius: 10px; transition: width 1s ease-in-out; }

  .unused-overlay { 
    margin-top: 20px; 
    padding: 10px; 
    background: #f8fafc; 
    border-radius: 12px; 
    font-size: 0.8rem; 
    color: #94a3b8; 
    text-align: center;
    font-weight: 500;
    border: 1px dashed #e2e8f0;
  }

  @media (max-width: 768px) {
    .header-box { flex-direction: column; align-items: flex-start; gap: 20px; }
    .search-wrapper input { width: 100%; }
  }
`;