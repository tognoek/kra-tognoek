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
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        q: searchQuery,
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
    if (topicName === "all") {
      setSelectedTopics([]);
      return;
    }
    setSelectedTopics(prev => {
      if (prev.includes(topicName)) {
        return prev.filter(t => t !== topicName);
      } else {
        return [...prev, topicName];
      }
    });
  };

  return (
    <div className="problems-container">
      <style dangerouslySetInnerHTML={{ __html: modernStyles }} />
      
      <header className="page-header">
        <div>
          <h1 className="main-title">📚 Kho Đề Bài</h1>
          <p className="sub-title">Tìm thấy {pagination.total} bài tập</p>
        </div>
        <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Tìm tên bài tập..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
        </div>
      </header>

      <div className="main-layout">
        <aside className="filter-sidebar">
          <div className="filter-section">
            <h4 className="filter-label">Độ khó</h4>
            <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="Easy">Dễ</option>
              <option value="Medium">Trung bình</option>
              <option value="Hard">Khó</option>
            </select>
          </div>

          <div className="filter-section">
            <h4 className="filter-label">Chủ đề (Chọn nhiều)</h4>
            <div className="topic-tags">
              <button 
                className={selectedTopics.length === 0 ? "tag active" : "tag"}
                onClick={() => toggleTopic("all")}
              >Tất cả</button>
              
              {topics.map(t => (
                <button 
                  key={t.IdChuDe}
                  className={selectedTopics.includes(t.TenChuDe) ? "tag active" : "tag"}
                  onClick={() => toggleTopic(t.TenChuDe)}
                >
                  {t.TenChuDe}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="problems-list">
          {loading ? (
            <div className="loader-container"><div className="spinner"></div></div>
          ) : problems.length === 0 ? (
            <div className="no-data">Không tìm thấy bài tập nào khớp với bộ lọc!</div>
          ) : (
            <>
              <div className="table-card">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Chủ đề</th>
                      <th>Độ khó</th>
                      <th>Giới hạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p) => (
                      <tr key={p.IdDeBai}>
                        <td><Link href={`/problems/${p.IdDeBai}`} className="p-title">{p.TieuDe}</Link></td>
                        <td>
                          <div className="topic-mini-tags">
                            {p.chuDes.map((c: string) => <span key={c}>{c}</span>)}
                          </div>
                        </td>
                        <td><DifficultyBadge difficulty={p.DoKho} /></td>
                        <td className="specs-cell">{p.GioiHanThoiGian}ms / {p.GioiHanBoNho}MB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PHẦN PHÂN TRANG GIỐNG CUỘC THI */}
              <div className="pagination">
                <button 
                  disabled={pagination.currentPage === 1} 
                  onClick={() => loadData(pagination.currentPage - 1)}
                  className="p-btn"
                >
                  &laquo; Trước
                </button>
                
                <div className="p-numbers">
                  {(() => {
                    let totalPages = pagination.totalPages;
                    let currentPage = pagination.currentPage;
                    let startPage = Math.max(1, currentPage - 1);
                    let endPage = Math.min(totalPages, startPage + 2);

                    if (endPage === totalPages) {
                      startPage = Math.max(1, endPage - 2);
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    return pages.map((num) => (
                      <button
                        key={num}
                        className={`p-num ${currentPage === num ? "active" : ""}`}
                        onClick={() => loadData(num)}
                      >
                        {num}
                      </button>
                    ));
                  })()}
                </div>

                <button 
                  disabled={pagination.currentPage === pagination.totalPages} 
                  onClick={() => loadData(pagination.currentPage + 1)}
                  className="p-btn"
                >
                  Sau &raquo;
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const modernStyles = `
  .problems-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 1px solid #edf2f7; padding-bottom: 20px; }
  .main-title { font-size: 2rem; font-weight: 800; color: #1a202c; margin: 0; }
  .sub-title { color: #718096; margin-top: 5px; font-size: 0.95rem; }

  .search-wrapper { position: relative; width: 320px; }
  .search-wrapper input { width: 100%; padding: 10px 40px 10px 15px; border: 2px solid #e2e8f0; border-radius: 10px; outline: none; transition: 0.2s; }
  .search-wrapper input:focus { border-color: #3182ce; }
  .search-icon { position: absolute; right: 15px; top: 10px; color: #a0aec0; }

  .main-layout { display: grid; grid-template-columns: 240px 1fr; gap: 30px; }
  .filter-sidebar { background: #fff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; height: fit-content; }
  .filter-section { margin-bottom: 25px; }
  .filter-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #a0aec0; margin-bottom: 12px; font-weight: 700; }
  .filter-section select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; outline: none; }

  .topic-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag { padding: 4px 10px; background: #f1f5f9; border: 1px solid transparent; border-radius: 6px; font-size: 0.8rem; cursor: pointer; color: #475569; transition: 0.2s; }
  .tag.active { background: #3182ce; color: white; }

  .table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .modern-table { width: 100%; border-collapse: collapse; }
  .modern-table th { background: #f8fafc; padding: 12px 15px; text-align: left; font-size: 0.75rem; color: #718096; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  .modern-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
  .p-title { font-weight: 600; color: #2d3748; text-decoration: none; }
  .p-title:hover { color: #3182ce; }

  .topic-mini-tags { display: flex; gap: 4px; flex-wrap: wrap; }
  .topic-mini-tags span { background: #ebf8ff; color: #2b6cb0; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
  .specs-cell { font-size: 0.8rem; color: #718096; line-height: 1.4; }

  /* PAGINATION STYLES SYNCED WITH CONTESTS */
  .pagination { display: flex; justify-content: center; align-items: center; margin-top: 40px; gap: 12px; }
  .p-btn { padding: 10px 20px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; font-weight: 700; color: #475569; cursor: pointer; transition: 0.2s; }
  .p-btn:hover:not(:disabled) { border-color: #cbd5e1; background: #f8fafc; }
  .p-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .p-numbers { display: flex; gap: 8px; }
  .p-num { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fff; font-weight: 700; color: #475569; cursor: pointer; transition: 0.2s; }
  .p-num.active { background: #0f172a; color: #fff; border-color: #0f172a; }
  .p-num:hover:not(.active) { background: #f8fafc; transform: translateY(-2px); }

  .total-footer { text-align: center; margin-top: 20px; font-size: 0.9rem; color: #94a3b8; font-style: italic; }

  .loader-container { text-align: center; padding: 50px; color: #718096; }
  .spinner { width: 30px; height: 30px; border: 4px solid #f1f5f9; border-top: 4px solid #3182ce; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 10px; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .no-data { text-align: center; padding: 50px; color: #a0aec0; font-style: italic; }
`;