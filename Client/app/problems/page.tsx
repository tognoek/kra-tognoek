"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DifficultyBadge from "../components/DifficultyBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  
  const [searchQuery, setSearchQuery] = useState("");
  // Đổi giá trị mặc định thành "all"
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
      if (typeof document !== "undefined") {
        document.title = `Danh sách bài tập - Kra tognoek`;
      }
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        q: searchQuery,
        // Backend sẽ nhận "1-3", "4-7", "8-10" hoặc "all"
        difficulty: selectedDifficulty,
        topics: selectedTopics.length > 0 ? selectedTopics.join(",") : "all"
      });

      const [probRes, topicRes] = await Promise.all([
        fetch(`${API_BASE}/api/problems?${query.toString()}`),
        fetch(`${API_BASE}/api/topics`)
      ]);

      const probData = await probRes.json();
      const topicData = await topicRes.json();
      
      setProblems(probData.problems || []);
      setPagination({ 
        total: probData.total || 0, 
        totalPages: probData.totalPages || 1, 
        currentPage: probData.currentPage || 1 
      });
      setTopics(topicData || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [searchQuery, selectedTopics, selectedDifficulty]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => loadData(1), 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedTopics, selectedDifficulty, loadData]);

  const toggleTopic = (topicName: string) => {
    if (topicName === "all") { setSelectedTopics([]); return; }
    setSelectedTopics(prev => prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName]);
  };

  return (
    <div className="problems-container">
      <style dangerouslySetInnerHTML={{ __html: modernStyles }} />
      
      <header className="page-header">
        <div>
          <h1 className="main-title">📚 Kho Đề Bài</h1>
          <p className="sub-title">Khám phá và thử thách với {pagination.total} bài tập</p>
        </div>
        <div className="search-wrapper">
            <input type="text" placeholder="Tìm tên bài tập..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="search-icon">🔍</span>
        </div>
      </header>

      <div className="main-layout">
        <aside className="filter-sidebar">
          {/* THIẾT KẾ ĐỘ KHÓ MỚI */}
          <div className="filter-section">
            <h4 className="filter-label">Mức độ</h4>
            <div className="difficulty-selector">
              <button className={selectedDifficulty === "all" ? "diff-btn active" : "diff-btn"} onClick={() => setSelectedDifficulty("all")}>Tất cả</button>
              <button className={selectedDifficulty === "1-3" ? "diff-btn easy active" : "diff-btn easy"} onClick={() => setSelectedDifficulty("1-3")}>Dễ</button>
              <button className={selectedDifficulty === "4-7" ? "diff-btn medium active" : "diff-btn medium"} onClick={() => setSelectedDifficulty("4-7")}>Vừa</button>
              <button className={selectedDifficulty === "8-10" ? "diff-btn hard active" : "diff-btn hard"} onClick={() => setSelectedDifficulty("8-10")}>Khó</button>
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-label">Chủ đề</h4>
            <div className="topic-tags">
              <button className={selectedTopics.length === 0 ? "tag active" : "tag"} onClick={() => toggleTopic("all")}>Tất cả</button>
              {topics.map(t => (
                <button key={t.IdChuDe} className={selectedTopics.includes(t.TenChuDe) ? "tag active" : "tag"} onClick={() => toggleTopic(t.TenChuDe)}>
                  {t.TenChuDe}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="problems-list">
          {loading ? (
            <div className="loader-container"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="table-card">
                <table className="modern-table">
                  <thead>
                    <tr><th>Tiêu đề</th><th>Chủ đề</th><th>Độ khó</th><th>Giới hạn</th></tr>
                  </thead>
                  <tbody>
                    {problems.length === 0 ? (
                        <tr><td colSpan={4} className="no-data-cell">Không tìm thấy bài tập phù hợp</td></tr>
                    ) : problems.map((p) => (
                      <tr key={p.IdDeBai}>
                        <td><Link href={`/problems/${p.IdDeBai}`} className="p-title">{p.TieuDe}</Link></td>
                        <td>
                          <div className="topic-mini-tags">
                            {p.chuDes.map((c: string) => <span key={c}>{c}</span>)}
                          </div>
                        </td>
                        <td><DifficultyBadge difficulty={p.DoKho} /></td>
                        <td className="specs-cell">{p.GioiHanThoiGian}ms / {p.GioiHanBoNho}kb</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button disabled={pagination.currentPage === 1} onClick={() => loadData(pagination.currentPage - 1)} className="p-btn">&laquo; Trước</button>
                  <div className="p-numbers">
                    {Array.from({length: pagination.totalPages}, (_, i) => i + 1).map(n => (
                        <button key={n} className={`p-num ${pagination.currentPage === n ? 'active' : ''}`} onClick={() => loadData(n)}>{n}</button>
                    ))}
                  </div>
                  <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => loadData(pagination.currentPage + 1)} className="p-btn">Sau &raquo;</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const modernStyles = `
  .problems-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
  .main-title { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0; }
  .sub-title { color: #64748b; font-size: 0.9rem; margin-top: 5px; }
  .search-wrapper { position: relative; width: 300px; }
  .search-wrapper input { width: 100%; padding: 10px 40px 10px 15px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; transition: 0.2s; background: #fff; }
  .search-wrapper input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
  .search-icon { position: absolute; right: 15px; top: 12px; color: #94a3b8; }

  .main-layout { display: grid; grid-template-columns: 260px 1fr; gap: 30px; }
  .filter-sidebar { display: flex; flex-direction: column; gap: 30px; }
  .filter-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 15px; font-weight: 800; }

  /* DIFFICULTY SELECTOR UI */
  .difficulty-selector { display: flex; flex-direction: column; gap: 8px; }
  .diff-btn { padding: 10px 15px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; text-align: left; font-size: 0.9rem; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; }
  .diff-btn:hover { border-color: #cbd5e1; background: #f8fafc; }
  .diff-btn.active { background: #1e293b; color: #fff; border-color: #1e293b; }
  .diff-btn.easy.active { background: #10b981; border-color: #10b981; }
  .diff-btn.medium.active { background: #f59e0b; border-color: #f59e0b; }
  .diff-btn.hard.active { background: #ef4444; border-color: #ef4444; }

  .topic-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { padding: 6px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; cursor: pointer; color: #475569; font-weight: 500; transition: 0.2s; }
  .tag:hover { border-color: #3b82f6; color: #3b82f6; }
  .tag.active { background: #3b82f6; color: white; border-color: #3b82f6; }

  .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .modern-table { width: 100%; border-collapse: collapse; }
  .modern-table th { background: #f8fafc; padding: 15px 20px; text-align: left; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  .modern-table td { padding: 20px; border-bottom: 1px solid #f1f5f9; }
  .p-title { font-weight: 700; color: #1e293b; text-decoration: none; font-size: 1rem; }
  .p-title:hover { color: #3b82f6; }

  .topic-mini-tags { display: flex; gap: 6px; }
  .topic-mini-tags span { background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
  .specs-cell { font-family: monospace; color: #64748b; font-size: 0.85rem; }
  .no-data-cell { text-align: center; padding: 60px; color: #94a3b8; font-style: italic; }

  .pagination { display: flex; justify-content: center; align-items: center; margin-top: 40px; gap: 10px; }
  .p-btn { padding: 10px 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 700; color: #475569; cursor: pointer; }
  .p-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .p-num { width: 40px; height: 40px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; font-weight: 700; cursor: pointer; }
  .p-num.active { background: #3b82f6; color: white; border-color: #3b82f6; }

  .spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 40px auto; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;