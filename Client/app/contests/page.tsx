"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ContestsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "running" | "finished" | "closed">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchContests = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/contests?page=${page}&limit=${limit}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Không thể tải danh sách cuộc thi");
      
      const json = await res.json();
      setData(json.contests);
      setTotalPages(json.totalPages);
      setTotalItems(json.total);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Danh sách cuộc thi - Kra tognoek";
    }
    fetchContests(currentPage);
  }, [currentPage, fetchContests]);

  const getContestStatus = (contest: any) => {
    const now = new Date();
    const start = new Date(contest.ThoiGianBatDau);
    const end = new Date(contest.ThoiGianKetThuc);

    if (!contest.TrangThai) return "Đóng";
    if (now < start) return "Sắp mở";
    if (now >= start && now <= end) return "Đang thi";
    return "Kết thúc";
  };

  const getFilteredData = () => {
    let result = [...data];
    if (searchQuery) {
      result = result.filter((c) =>
        c.TenCuocThi?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      result = result.filter((c) => {
        const status = getContestStatus(c);
        if (filterStatus === "upcoming") return status === "Sắp mở";
        if (filterStatus === "running") return status === "Đang thi";
        if (filterStatus === "finished") return status === "Kết thúc";
        if (filterStatus === "closed") return status === "Đóng";
        return true;
      });
    }
    if (startDate) {
      result = result.filter((c) => new Date(c.ThoiGianBatDau) >= new Date(startDate));
    }
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      result = result.filter((c) => new Date(c.ThoiGianBatDau) <= endLimit);
    }
    return result;
  };

  const filteredContests = getFilteredData();

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setStartDate("");
    setEndDate("");
  };

  if (error) return <div className="error-box">⚠️ Lỗi: {error}</div>;

  return (
    <div className="contests-container">
      <style dangerouslySetInnerHTML={{ __html: contestPageStyles }} />

      <div className="header-section">
        <div className="header-content">
          <h1 className="main-title">🏆 Cuộc thi trực tuyến</h1>
          <p className="sub-title">Khám phá và tham gia các kỳ thi lập trình đỉnh cao.</p>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-grid">
          {/* Row 1 */}
          <div className="filter-group flex-2">
            <label className="filter-label">Tìm kiếm cuộc thi</label>
            <div className="search-input-box">
              <input
                type="text"
                placeholder="Nhập tên cuộc thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon-btn">🔍</span>
            </div>
          </div>

          <div className="filter-group flex-1">
            <label className="filter-label">Trạng thái</label>
            <select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="running">🔥 Đang thi</option>
              <option value="upcoming">⏳ Sắp mở</option>
              <option value="finished">🏁 Kết thúc</option>
              <option value="closed">🔒 Đóng</option>
            </select>
          </div>

          {/* Row 2 */}
          <div className="filter-group flex-1">
            <label className="filter-label">Từ ngày</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="filter-group flex-1">
            <label className="filter-label">Đến ngày</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Nút reset đặt ở góc phải dưới của card */}
        <div className="filter-actions-bottom">
          <button className="refresh-data-btn" onClick={() => fetchContests(currentPage)} title="Tải lại dữ liệu từ máy chủ">
             Tải lại 🔄
          </button>
          <button className="reset-btn" onClick={handleResetFilters}>
            Làm mới bộ lọc 🧹
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="contest-table">
          <thead>
            <tr>
              <th>Cuộc thi</th>
              <th>Thời gian mốc</th>
              <th>Trạng thái</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="loading-td"><div className="spinner"></div></td></tr>
            ) : filteredContests.length === 0 ? (
              <tr><td colSpan={4} className="empty-td"><p>Không tìm thấy cuộc thi nào.</p></td></tr>
            ) : (
              filteredContests.map((c) => {
                const status = getContestStatus(c);
                const statusKey = status === "Sắp mở" ? "upcoming" : status === "Đang thi" ? "running" : status === "Đóng" ? "closed" : "finished";
                
                return (
                  <tr key={c.IdCuocThi}>
                    <td>
                      <div className="name-col">
                        <Link href={`/contests/${c.IdCuocThi}`} className="contest-name">{c.TenCuocThi}</Link>
                        <div className="meta-info">
                          <span>👤 {c.HoTenTacGia}</span>
                          <span className="sep">•</span>
                          <span>📚 {c.deBais?.length || 0} bài tập</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="time-col">
                        <div className="time-item"><span className="time-label">Bắt đầu:</span><span className="time-val">{new Date(c.ThoiGianBatDau).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                        <div className="time-item"><span className="time-label">Kết thúc:</span><span className="time-val">{new Date(c.ThoiGianKetThuc).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                      </div>
                    </td>
                    <td>
                      <div className={`status-badge-wrapper badge-${statusKey}`}>
                        {status}
                      </div>
                    </td>
                    <td className="text-center">
                      <Link href={`/contests/${c.IdCuocThi}`} className={`action-btn btn-${statusKey}`}>
                        {status === "Đang thi" ? "Tham gia" : "Chi tiết"}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-btn">&laquo; Trước</button>
          <div className="p-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(num => Math.abs(num - currentPage) <= 1 || num === 1 || num === totalPages)
              .map(num => (
                <button key={num} className={`p-num ${currentPage === num ? "active" : ""}`} onClick={() => setCurrentPage(num)}>{num}</button>
              ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-btn">Sau &raquo;</button>
        </div>
      )}
    </div>
  );
}

const contestPageStyles = `
  .contests-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  .header-section { margin-bottom: 40px; }
  .main-title { font-size: 2.5rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
  .sub-title { color: #64748b; font-size: 1.1rem; margin-top: 10px; }

  .filter-card { 
    background: #fff; 
    padding: 25px; 
    border-radius: 20px; 
    border: 1px solid #e2e8f0; 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
    margin-bottom: 40px; 
    position: relative;
  }
  
  .filter-grid { 
    display: grid; 
    grid-template-columns: 2fr 1fr 1fr 1fr; 
    gap: 20px; 
    margin-bottom: 20px; 
  }

  .filter-group { display: flex; flex-direction: column; }
  .filter-label { font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 10px; text-transform: uppercase; }

  .search-input-box { display: flex; align-items: center; background: #f1f5f9; border-radius: 12px; padding: 0 16px; border: 1.5px solid transparent; transition: all 0.2s; }
  .search-input-box:focus-within { background: #fff; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
  .search-input-box input { flex: 1; background: transparent; border: none; padding: 12px 0; font-size: 1rem; color: #1e293b; outline: none; }
  .search-icon-btn { font-size: 1.1rem; color: #94a3b8; margin-left: 8px; }

  .filter-group select, .filter-group input[type="date"] { 
    width: 100%; 
    padding: 12px 16px; 
    background: #f1f5f9; 
    border: 1.5px solid transparent; 
    border-radius: 12px; 
    font-size: 1rem; 
    color: #1e293b; 
    outline: none; 
    transition: all 0.2s; 
  }
  .filter-group select:focus, .filter-group input[type="date"]:focus { background: #fff; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }

  /* New Bottom Actions Area */
  .filter-actions-bottom {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid #f1f5f9;
    padding-top: 20px;
  }

  .reset-btn { 
    background: #f1f5f9; 
    color: #475569; 
    border: none; 
    padding: 10px 20px; 
    border-radius: 10px; 
    font-weight: 700; 
    cursor: pointer; 
    transition: 0.2s; 
    font-size: 0.9rem;
  }
  .reset-btn:hover { background: #e2e8f0; color: #0f172a; }

  .refresh-data-btn {
    background: transparent;
    color: #2563eb;
    border: 1.5px solid #dbeafe;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    font-size: 0.9rem;
  }
  .refresh-data-btn:hover { background: #eff6ff; border-color: #2563eb; }

  .table-wrapper { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
  .contest-table { width: 100%; border-collapse: collapse; text-align: left; }
  .contest-table th { background: #f8fafc; padding: 18px 24px; font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: 700; border-bottom: 1.5px solid #e2e8f0; }
  .contest-table td { padding: 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

  .status-badge-wrapper { display: inline-block; padding: 6px 14px; border-radius: 99px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
  .badge-running { background: #dbeafe; color: #1e40af; }
  .badge-upcoming { background: #dcfce7; color: #15803d; }
  .badge-finished { background: #f1f5f9; color: #475569; }
  .badge-closed { background: #fee2e2; color: #991b1b; }

  .action-btn { display: inline-block; padding: 10px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 0.9rem; transition: 0.2s; min-width: 100px; }
  .btn-running { background: #2563eb; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  .btn-running:hover { background: #1d4ed8; transform: translateY(-2px); }
  .btn-upcoming { background: #dcfce7; color: #15803d; border: 1.5px solid #bbf7d0; }
  .btn-finished { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
  .btn-closed { background: #fee2e2; color: #991b1b; border: 1.5px solid #fecaca; }

  .name-col .contest-name { font-size: 1.25rem; font-weight: 800; color: #1e293b; text-decoration: none; }
  .name-col .contest-name:hover { color: #2563eb; }
  .meta-info { margin-top: 8px; display: flex; gap: 12px; font-size: 0.85rem; color: #64748b; }
  .sep { color: #cbd5e1; }
  .time-col { display: flex; flex-direction: column; gap: 6px; }
  .time-item { display: flex; gap: 8px; font-size: 0.9rem; }
  .time-label { color: #94a3b8; min-width: 60px; }
  .time-val { color: #334155; font-weight: 600; }

  .pagination { display: flex; justify-content: center; align-items: center; margin-top: 40px; gap: 12px; }
  .p-btn { padding: 10px 20px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; font-weight: 700; color: #475569; cursor: pointer; }
  .p-num { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fff; font-weight: 700; color: #475569; cursor: pointer; }
  .p-num.active { background: #0f172a; color: #fff; border-color: #0f172a; }

  .loading-td, .empty-td { padding: 80px 0 !important; text-align: center; color: #64748b; }
  .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  @media (max-width: 1024px) {
    .filter-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 768px) {
    .filter-grid { grid-template-columns: 1fr; }
    .contest-table thead { display: none; }
    .contest-table td { display: block; width: 100%; box-sizing: border-box; }
    .text-center { text-align: left; }
  }
`;