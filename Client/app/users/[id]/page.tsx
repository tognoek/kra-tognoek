"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States cho danh sách bài nộp của người này
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subSearch, setSubSearch] = useState("");

  const fetchUserData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Người dùng không tồn tại");
      const data = await res.json();
      setUser(data);
      
      if (typeof document !== "undefined") {
        document.title = `Hồ sơ của ${data.HoTen} - OJ Portal`;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (userId: string, page: number, q: string) => {
    setSubLoading(true);
    try {
      const query = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: "10",
        q: q
      });
      const res = await fetch(`${API_BASE}/api/submissions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setSubTotalPages(data.totalPages || 1);
      }
    } catch (error) { console.error(error); }
    finally { setSubLoading(false); }
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchUserData(params.id as string);
    }
  }, [params.id, fetchUserData]);

  useEffect(() => {
    if (params.id) {
      const delayDebounce = setTimeout(() => {
        fetchSubmissions(params.id as string, subPage, subSearch);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [params.id, subPage, subSearch, fetchSubmissions]);

  if (loading) return <div className="loader-box">Đang tải thông tin...</div>;
  if (error || !user) return <div className="loader-box">⚠️ {error}</div>;

  const acRate = user.stats.totalSubmissions > 0 
    ? Math.round((user.stats.successfulSubmissions / user.stats.totalSubmissions) * 100) 
    : 0;

  return (
    <div className="profile-wrapper">
      <style dangerouslySetInnerHTML={{ __html: modernUIStyles }} />

      <div className="content-constrain">
        {/* Header Profile - Đã ẩn Tên Đăng Nhập */}
        <div className="profile-hero">
          <div className="avatar-large">{user.HoTen.charAt(0)}</div>
          <div className="hero-info">
            <h1 className="user-fullname">{user.HoTen}</h1>
            <p className="user-handle"><span className="role-badge">{user.VaiTro}</span></p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          <div className="glass-card info-card">
            <h3 className="card-title">Thông tin</h3>
            <div className="info-row">
              <span className="info-label">Trạng thái</span>
              <span className={`info-value ${user.TrangThai ? 'text-green' : ''}`}>
                {user.TrangThai ? "Đang hoạt động" : "Ngoại tuyến"}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Ngày gia nhập</span>
              <span className="info-value">{new Date(user.NgayTao).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>

          <div className="glass-card skill-card">
            <h3 className="card-title">Thống kê hoạt động</h3>
            <div className="skill-content-layout">
              <div className="accuracy-container">
                <div className="accuracy-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" style={{ strokeDasharray: `${acRate}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="percentage">{acRate}%</text>
                  </svg>
                </div>
                <div className="accuracy-stats">
                  <div className="stat-mini"><span className="dot ac"></span> AC: <strong>{user.stats.successfulSubmissions}</strong></div>
                  <div className="stat-mini"><span className="dot total"></span> Tổng: <strong>{user.stats.totalSubmissions}</strong></div>
                </div>
              </div>

              <div className="extra-stats-grid">
                <div className="extra-stat-item">
                  <span className="extra-val">{user.stats.participatedContests}</span>
                  <span className="extra-lbl">Cuộc thi tham gia</span>
                </div>
                <div className="extra-stat-item">
                  <span className="extra-val">{user.stats.totalProblems}</span>
                  <span className="extra-lbl">Đề bài đã tạo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách bài nộp của người dùng */}
        <div className="glass-card sub-section">
          <div className="sub-header">
            <h3 className="card-title">Lịch sử bài nộp của {user.HoTen}</h3>
            <div className="search-box-mini">
              <input 
                type="text" 
                placeholder="Tìm tên bài..." 
                value={subSearch}
                onChange={(e) => { setSubSearch(e.target.value); setSubPage(1); }}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="sub-table">
              <thead>
                <tr>
                  <th>Bài tập</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Ngày nộp</th>
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  <tr><td colSpan={4} className="loading-text">Đang tải...</td></tr>
                ) : submissions.length === 0 ? (
                  <tr><td colSpan={4} className="empty-text">Chưa có bài nộp nào.</td></tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s.IdBaiNop}>
                      <td><Link href={`/problems/${s.IdDeBai}`} className="p-link">{s.deBai?.TieuDe}</Link></td>
                      <td>
                        <span className={`st-badge ${s.TrangThaiCham === "accepted" ? "accepted" : "rejected"}`}>
                          {s.TrangThaiCham || "Pending"}
                        </span>
                      </td>
                      <td>{s.ThoiGianThucThi}ms</td>
                      <td className="date-cell">{new Date(s.NgayNop).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {subTotalPages > 1 && (
            <div className="pagination">
              <button disabled={subPage === 1} onClick={() => setSubPage(p => p - 1)} className="p-btn">&laquo;</button>
              <span className="p-info">Trang {subPage} / {subTotalPages}</span>
              <button disabled={subPage === subTotalPages} onClick={() => setSubPage(p => p + 1)} className="p-btn">&raquo;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const modernUIStyles = `
  .profile-wrapper { padding: 40px 20px; font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; }
  .content-constrain { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

  .profile-hero { display: flex; align-items: center; gap: 24px; background: white; padding: 24px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .avatar-large { width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; }
  .user-fullname { font-size: 24px; font-weight: 800; color: #1e293b; margin: 0; }
  .role-badge { background: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }

  .main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: stretch; }
  .glass-card { background: white; padding: 24px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }

  .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
  .info-label { color: #64748b; }
  .info-value { color: #1e293b; font-weight: 600; }
  .text-green { color: #10b981; }

  .skill-content-layout { display: flex; flex-direction: column; gap: 24px; }
  .accuracy-container { display: flex; align-items: center; gap: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
  .accuracy-circle { width: 100px; }
  .circular-chart { display: block; max-width: 100%; }
  .circle-bg { fill: none; stroke: #eee; stroke-width: 3; }
  .circle { fill: none; stroke-width: 3; stroke-linecap: round; stroke: #22c55e; transition: stroke-dasharray 1s ease; }
  .percentage { fill: #1e293b; font-size: 0.5em; text-anchor: middle; font-weight: 800; }
  .accuracy-stats { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .stat-mini { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
  .dot.ac { background: #22c55e; } .dot.total { background: #6366f1; }

  .extra-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
  .extra-stat-item { background: #f8fafc; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #f1f5f9; }
  .extra-val { display: block; font-size: 18px; font-weight: 800; color: #1e293b; }
  .extra-lbl { font-size: 11px; color: #64748b; font-weight: 600; line-height: 1.2; display: block; margin-top: 2px; }

  .sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .search-box-mini { position: relative; width: 250px; }
  .search-box-mini input { width: 100%; padding: 8px 35px 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
  .search-icon { position: absolute; right: 10px; top: 8px; font-size: 14px; opacity: 0.4; }

  .sub-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .sub-table th { text-align: left; padding: 12px; color: #64748b; border-bottom: 2px solid #f1f5f9; }
  .sub-table td { padding: 12px; border-bottom: 1px solid #f8fafc; }
  .p-link { color: #2563eb; font-weight: 600; text-decoration: none; }
  .st-badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  .st-badge.accepted { background: #dcfce7; color: #15803d; }
  .st-badge.rejected { background: #fee2e2; color: #b91c1c; }

  .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
  .p-btn { padding: 5px 12px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
  .p-info { font-size: 13px; color: #64748b; }
  .loader-box { padding: 100px; text-align: center; color: #64748b; }

  @media (max-width: 800px) {
    .main-grid { grid-template-columns: 1fr; }
    .sub-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .search-box-mini { width: 100%; }
  }
`;