"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function SubmissionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Lấy thông tin user hiện tại từ local để so sánh
  useEffect(() => {
    const userStr = localStorage.getItem("oj_user");
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  const loadSubmissions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        q: searchQuery,
      });
      const res = await fetch(`${API_BASE}/api/submissions?${query.toString()}`);
      const json = await res.json();
      setData(json.submissions || []);
      setPagination({ total: json.total, totalPages: json.totalPages, currentPage: json.currentPage });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadSubmissions(1);
    }, 500); // Debounce để tránh spam API
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Polling để cập nhật trạng thái chấm bài
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) loadSubmissions(pagination.currentPage);
    }, 10000);
    return () => clearInterval(interval);
  }, [pagination.currentPage, searchQuery, loading]);

  const getStatusUI = (status: string | null) => {
    if (!status) return <span className="st-badge pending">⏳ Đang chấm...</span>;
    if (status === "accepted") return <span className="st-badge accepted">✅ Accepted</span>;
    if (status === "compile_error") return <span className="st-badge error">❌ Lỗi biên dịch</span>;
    
    let label = status;
    if (status.includes("wrong_answer")) label = `❌ Sai test ${status.split(":")[1]}`;
    if (status.includes("time_limit")) label = `⏳ Quá thời gian ${status.split(":")[1]}`;
    if (status.includes("memory_limit")) label = `💾 Quá bộ nhớ ${status.split(":")[1]}`;
    
    return <span className="st-badge error">{label}</span>;
  };

  return (
    <div className="sub-page-container">
      <style dangerouslySetInnerHTML={{ __html: subPageStyles }} />
      
      <div className="page-header">
        <h1 className="main-title">📜 Nhật ký bài nộp</h1>
        <p className="sub-title">Theo dõi trạng thái chấm bài thời gian thực</p>
      </div>

      {/* Thanh tìm kiếm thiết kế mới: Label và Input trên 1 hàng */}
      <div className="search-filter-row">
        <div className="search-inline-group">
          <label htmlFor="search">Tìm kiếm bài nộp:</label>
          <div className="search-box">
            <input 
              id="search"
              placeholder="Nhập tên bài tập hoặc tên thí sinh..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="icon">🔍</span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="sub-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bài tập</th>
              <th>Người nộp</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Bộ nhớ</th>
              <th>Ngày nộp</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
               <tr><td colSpan={7} className="loading-state">Đang tải dữ liệu...</td></tr>
            ) : data.map((s) => {
              // Logic kiểm tra bản thân hay người khác
              const isMe = currentUser && s.taiKhoan?.IdTaiKhoan?.toString() === currentUser.IdTaiKhoan?.toString();
              const userProfileLink = isMe ? "/profile" : `/users/${s.taiKhoan?.IdTaiKhoan}`;

              return (
                <tr key={s.IdBaiNop} className={isMe ? "is-me-row" : ""}>
                  <td className="id-cell">#{s.IdBaiNop}</td>
                  <td><Link href={`/problems/${s.IdDeBai}`} className="p-link">{s.deBai?.TieuDe}</Link></td>
                  <td>
                    <Link href={userProfileLink} className="user-link-item">
                      <div className="u-info">
                        {/* Chỉ hiện tên, màu sắc sẽ do class is-me-row ở thẻ tr quyết định */}
                        <span className="u-name">{s.taiKhoan?.HoTen}</span>
                      </div>
                    </Link>
                  </td>
                  <td>{getStatusUI(s.TrangThaiCham)}</td>
                  <td className="mono">{s.ThoiGianThucThi ?? 0}ms</td>
                  <td className="mono">{s.BoNhoSuDung ?? 0}KB</td>
                  <td className="date-cell">{new Date(s.NgayNop).toLocaleString("vi-VN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="pagination">
        <button disabled={pagination.currentPage === 1} onClick={() => loadSubmissions(pagination.currentPage - 1)} className="p-btn">Trước</button>
        <div className="p-numbers">
          {(() => {
            let start = Math.max(1, pagination.currentPage - 1);
            let end = Math.min(pagination.totalPages, start + 2);
            if (end === pagination.totalPages) start = Math.max(1, end - 2);
            const pages = [];
            for (let i = start; i <= end; i++) pages.push(i);
            return pages.map(num => (
              <button key={num} className={`p-num ${pagination.currentPage === num ? "active" : ""}`} onClick={() => loadSubmissions(num)}>{num}</button>
            ));
          })()}
        </div>
        <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => loadSubmissions(pagination.currentPage + 1)} className="p-btn">Sau</button>
      </div>
    </div>
  );
}

const subPageStyles = `
  .sub-page-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  .page-header { margin-bottom: 30px; }
  .main-title { font-size: 2.2rem; font-weight: 800; color: #1e293b; }
  .sub-title { color: #64748b; font-size: 1rem; }

  /* Search row design: label and input on same line */
  .search-filter-row { 
    background: white; 
    padding: 16px 24px; 
    border-radius: 16px; 
    border: 1px solid #e2e8f0; 
    margin-bottom: 30px; 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
  }
  .search-inline-group { 
    display: flex; 
    align-items: center; 
    gap: 16px; 
  }
  .search-inline-group label { 
    font-size: 0.9rem; 
    font-weight: 700; 
    color: #475569; 
    white-space: nowrap;
  }
  .search-box { 
    flex: 1;
    position: relative; 
    display: flex; 
    align-items: center; 
    background: #f8fafc; 
    border-radius: 12px; 
    padding: 0 15px; 
    border: 1.5px solid transparent; 
    transition: all 0.2s;
  }
    /* Màu sắc đặc biệt cho dòng của bản thân */
  .is-me-row {
    background-color: #eff6ff !important; /* Màu xanh dương cực nhạt */
  }

  .is-me-row:hover {
    background-color: #dbeafe !important; /* Đậm hơn một chút khi hover */
  }

  .is-me-row .u-name {
    color: #2563eb; /* Tên của bạn sẽ hiện màu xanh dương đậm */
    font-weight: 800; /* Chữ dày hơn */
  }

  .is-me-row .id-cell {
    color: #3b82f6;
  }

  /* Đảm bảo các cột khác trong dòng cũng hài hòa */
  .is-me-row td {
    border-bottom-color: #bfdbfe;
  }
  .search-box input { 
    width: 100%; 
    padding: 10px 0; 
    background: transparent; 
    border: none; 
    outline: none; 
    font-size: 0.95rem; 
    color: #1e293b;
  }
  .search-box:focus-within { 
    background: white; 
    border-color: #2563eb; 
    box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
  }
  .search-box .icon { color: #94a3b8; font-size: 1rem; }

  .table-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
  .sub-table { width: 100%; border-collapse: collapse; text-align: left; }
  .sub-table th { background: #f8fafc; padding: 15px 20px; font-size: 0.8rem; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  .sub-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
  
  .id-cell { font-family: monospace; color: #94a3b8; font-weight: 600; }
  .p-link { color: #2563eb; font-weight: 700; text-decoration: none; }
  .p-link:hover { text-decoration: underline; }

  /* User Link Item */
  .user-link-item { text-decoration: none; color: inherit; display: block; border-radius: 8px; transition: background 0.2s; }
  .user-link-item:hover { background: #f1f5f9; }
  .u-info { display: flex; flex-direction: column; padding: 2px 4px; }
  .u-name { font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px; }
  .me-tag { color: #2563eb; font-weight: 800; font-size: 0.75rem; background: #eff6ff; padding: 1px 6px; border-radius: 4px; }
  .u-handle { font-size: 0.8rem; color: #94a3b8; }

  .mono { font-family: monospace; color: #475569; }
  .date-cell { font-size: 0.85rem; color: #64748b; }

  .st-badge { padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; display: inline-block; }
  .st-badge.accepted { background: #dcfce7; color: #15803d; }
  .st-badge.error { background: #fee2e2; color: #b91c1c; }
  .st-badge.pending { background: #fefce8; color: #a16207; }

  .pagination { display: flex; justify-content: center; align-items: center; margin-top: 30px; gap: 10px; }
  .p-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .p-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
  .p-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .p-num { width: 40px; height: 40px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 700; transition: 0.2s; }
  .p-num:hover:not(.active) { background: #f8fafc; border-color: #cbd5e1; }
  .p-num.active { background: #1e293b; color: white; border-color: #1e293b; }
  
  .loading-state { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

  @media (max-width: 768px) {
    .search-inline-group { flex-direction: column; align-items: flex-start; gap: 8px; }
    .search-box { width: 100%; }
  }
`;