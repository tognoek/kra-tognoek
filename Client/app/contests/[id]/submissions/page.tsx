"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ContestSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contests/${contestId}/submissions?q=${search}`);
      const data = await res.json();
      setSubmissions(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, [contestId]);

  const getStatusDisplay = (trangThai: string | null) => {
    if (!trangThai) return <span className="st-pending">⌛ Đang chấm...</span>;
    try {
      const codes = JSON.parse(trangThai);
      if (codes[0] === -1) return <span className="st-error">Compile Error</span>;
      
      const isAC = codes.every((c: number) => c === 0);
      if (isAC) return <span className="st-ac">Accepted</span>;
      
      if (codes.includes(2)) return <span className="st-wa">Time Limit Exceeded</span>;
      if (codes.includes(3)) return <span className="st-wa">Memory Limit Exceeded</span>;
      return <span className="st-wa">Wrong Answer</span>;
    } catch (e) {
      return <span className="st-error">Error</span>;
    }
  };

  return (
    <div className="sub-container">
      <style dangerouslySetInnerHTML={{ __html: subStyles }} />
      
      {/* Top Navigation */}
      <div className="top-nav-row">
        <button onClick={() => router.back()} className="btn-modern-back">
          <span className="arrow">←</span>
          <span className="text">Quay lại cuộc thi</span>
        </button>
        
        <Link href={`/contests/${contestId}/rank`} className="btn-modern-rank">
          <span className="icon">🏆</span>
          <span className="text">Xem bảng xếp hạng</span>
        </Link>
      </div>

      <div className="sub-header">
        <div className="title-group">
          <h1>📜 Bài nộp cuộc thi</h1>
          <p className="subtitle">Danh sách lịch sử bài nộp của tất cả thí sinh</p>
        </div>
        
        <div className="filter-box">
          <div className="input-wrapper">
            <input 
              placeholder="Tìm tên thí sinh..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSubmissions()}
            />
            <span className="search-icon">🔍</span>
          </div>
          <button className="btn-filter" onClick={fetchSubmissions}>Tìm kiếm</button>
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách bài nộp...</p>
          </div>
        ) : submissions.length > 0 ? (
          <table className="sub-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người nộp</th>
                <th>Bài tập</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th>Bộ nhớ</th>
                <th>Ngôn ngữ</th>
                <th>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.IdBaiNop}>
                  <td className="id-cell">#{s.IdBaiNop}</td>
                  <td>
                    <div className="user-info">
                      <span className="name">{s.taiKhoan.HoTen}</span>
                    </div>
                  </td>
                  <td className="prob-title">{s.deBai.TieuDe}</td>
                  <td>{getStatusDisplay(s.TrangThaiCham)}</td>
                  <td className="spec-cell">{s.ThoiGianThucThi || 0} ms</td>
                  <td className="spec-cell">{s.BoNhoSuDung || 0} kb</td>
                  <td className="lang-cell"><span>{s.ngonNgu.TenNgonNgu}</span></td>
                  <td className="date-cell">{new Date(s.NgayNop).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-text">
            <div className="empty-icon">📂</div>
            <p>Chưa có bài nộp nào phù hợp trong cuộc thi này.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const subStyles = `
  
  /* Navigation Row */
  .top-nav-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
  
  .btn-modern-back { 
    display: flex; align-items: center; gap: 10px; background: white; border: 1px solid #e2e8f0; 
    padding: 10px 18px; border-radius: 12px; cursor: pointer; transition: all 0.2s;
    color: #475569; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }
  .btn-modern-back:hover { background: #f1f5f9; color: #1e293b; transform: translateX(-4px); }
  .btn-modern-back .arrow { font-size: 18px; }

  .btn-modern-rank {
    display: flex; align-items: center; gap: 10px; background: #2563eb; color: white;
    padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: 700;
    transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.2);
  }
  .btn-modern-rank:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(37,99,235,0.3); }

  /* Header & Filter */
  .sub-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
  .title-group h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
  .title-group p { color: #64748b; margin: 5px 0 0; }

  .filter-box { display: flex; gap: 12px; align-items: center; }
  .input-wrapper { position: relative; }
  .input-wrapper input { 
    padding: 12px 15px 12px 40px; border: 1px solid #e2e8f0; border-radius: 12px; 
    width: 280px; outline: none; transition: 0.2s; background: white; font-size: 14px;
  }
  .input-wrapper input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
  .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); opacity: 0.4; }
  
  .btn-filter { 
    background: #0f172a; color: white; border: none; padding: 12px 24px; 
    border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;
  }
  .btn-filter:hover { background: #1e293b; }

  /* Table Card */
  .table-card { 
    background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); 
    border: 1px solid #e2e8f0; overflow: hidden; 
  }
  
  .sub-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
  .sub-table th { background: #f8fafc; padding: 18px 20px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
  .sub-table td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
  .sub-table tr:last-child td { border-bottom: none; }
  .sub-table tr:hover { background-color: #fcfcfd; }

  .id-cell { font-family: monospace; font-weight: 600; color: #94a3b8; }
  .user-info { display: flex; flex-direction: column; }
  .user-info .name { font-weight: 700; color: #1e293b; }
  .user-info .handle { font-size: 12px; color: #94a3b8; }
  .prob-title { font-weight: 600; color: #2563eb; }
  .spec-cell { font-family: monospace; font-size: 13px; }
  .lang-cell span { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; }

  /* Status Badge Styling */
  .st-ac { color: #10b981; font-weight: 700; background: #ecfdf5; padding: 6px 12px; border-radius: 8px; border: 1px solid #d1fae5; display: inline-block; }
  .st-wa { color: #ef4444; font-weight: 700; background: #fef2f2; padding: 6px 12px; border-radius: 8px; border: 1px solid #fee2e2; display: inline-block; }
  .st-error { color: #f59e0b; font-weight: 700; background: #fffbeb; padding: 6px 12px; border-radius: 8px; border: 1px solid #fef3c7; display: inline-block; }
  .st-pending { color: #64748b; font-style: italic; background: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; }

  /* States */
  .loading-state { padding: 80px; text-align: center; color: #64748b; }
  .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  
  .empty-text { padding: 80px; text-align: center; color: #94a3b8; }
  .empty-icon { font-size: 50px; margin-bottom: 10px; opacity: 0.3; }

  @media (max-width: 900px) {
    .sub-header { flex-direction: column; align-items: flex-start; }
    .filter-box { width: 100%; }
    .input-wrapper, .input-wrapper input { width: 100%; }
  }
`;  