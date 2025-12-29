"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CryptoJS from "crypto-js";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'submissions' | 'contests'>('submissions');

  // Submissions States
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subSearch, setSubSearch] = useState("");

  // Contests States (Phân trang cuộc thi)
  const [contestPage, setContestPage] = useState(1);
  const itemsPerPage = 5;

  // Hàm lấy ảnh Gravatar
  const getAvatarUrl = (email?: string) => {
    const address = String(email || "default").trim().toLowerCase();
    const hash = CryptoJS.MD5(address).toString();
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
  };

  const fetchUserData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Người dùng không tồn tại");
      const data = await res.json();
      setUser(data);
      if (typeof document !== "undefined") {
        document.title = `Hồ sơ của ${data.HoTen} - Kra tognoek`;
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
    if (params.id && activeTab === 'submissions') {
      const delayDebounce = setTimeout(() => {
        fetchSubmissions(params.id as string, subPage, subSearch);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [params.id, subPage, subSearch, fetchSubmissions, activeTab]);

  if (loading) return <div className="loader-box">Đang tải thông tin...</div>;
  if (error || !user) return <div className="loader-box">⚠️ {error}</div>;

  const acRate = user.stats.totalSubmissions > 0 
    ? Math.round((user.stats.successfulSubmissions / user.stats.totalSubmissions) * 100) 
    : 0;

  // Logic phân trang cho danh sách cuộc thi (Client-side pagination dựa trên mảng participatedContests)
  const totalContestPages = Math.ceil((user.participatedContests?.length || 0) / itemsPerPage);
  const currentContests = user.participatedContests?.slice(
    (contestPage - 1) * itemsPerPage,
    contestPage * itemsPerPage
  );

  return (
    <div className="profile-wrapper">
      <style dangerouslySetInnerHTML={{ __html: modernUIStyles }} />

      <div className="content-constrain">
        {/* Header Profile */}
        <div className="profile-hero">
          <div className="avatar-container">
            <img src={getAvatarUrl(user.Email)} alt="avatar" className="avatar-img" />
          </div>
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
                  <span className="circle-label">Tỉ lệ AC</span>
                </div>
                <div className="accuracy-stats">
                  <div className="stat-mini"><span className="dot ac"></span> AC: <strong>{user.stats.successfulSubmissions}</strong></div>
                  <div className="stat-mini"><span className="dot total"></span> Tổng: <strong>{user.stats.totalSubmissions}</strong></div>
                </div>
              </div>

              <div className="extra-stats-grid">
                <div className="extra-stat-item">
                  <span className="extra-val">{user.stats.participatedContestsCount || 0}</span>
                  <span className="extra-lbl">Cuộc thi</span>
                </div>
                <div className="extra-stat-item">
                  <span className="extra-val">{user.stats.totalProblems}</span>
                  <span className="extra-lbl">Đề bài đã tạo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher Section */}
        <div className="glass-card history-section">
          <div className="history-header">
            <div className="tab-switcher">
              <button 
                className={`tab-item ${activeTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('submissions')}
              >
                Lịch sử bài nộp
              </button>
              <button 
                className={`tab-item ${activeTab === 'contests' ? 'active' : ''}`}
                onClick={() => setActiveTab('contests')}
              >
                Cuộc thi tham gia
              </button>
            </div>
            
            {activeTab === 'submissions' && (
              <div className="search-box-mini">
                <input 
                  type="text" 
                  placeholder="Tìm tên bài..." 
                  value={subSearch}
                  onChange={(e) => { setSubSearch(e.target.value); setSubPage(1); }}
                />
                <span className="search-icon">🔍</span>
              </div>
            )}
          </div>

          <div className="tab-body">
            {activeTab === 'submissions' ? (
              <div className="table-wrapper animate-slide">
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
                            <span className={`st-badge ${s.TrangThaiCham === "accepted" || s.TrangThaiCham === "hoan_tat" ? "accepted" : "rejected"}`}>
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
                {subTotalPages > 1 && (
                  <div className="pagination">
                    <button disabled={subPage === 1} onClick={() => setSubPage(p => p - 1)} className="p-btn">&laquo;</button>
                    <span className="p-info">Trang {subPage} / {subTotalPages}</span>
                    <button disabled={subPage === subTotalPages} onClick={() => setSubPage(p => p + 1)} className="p-btn">&raquo;</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="table-wrapper animate-slide">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Tên cuộc thi</th>
                      <th>Bắt đầu</th>
                      <th>Kết thúc</th>
                      <th className="text-center">Bài nộp</th>
                      <th className="text-center">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!user.participatedContests || user.participatedContests.length === 0 ? (
                      <tr><td colSpan={5} className="empty-text">Chưa tham gia cuộc thi nào.</td></tr>
                    ) : (
                      currentContests.map((c: any) => (
                        <tr key={c.IdCuocThi}>
                          <td><Link href={`/contests/${c.IdCuocThi}`} className="p-link">🏆 {c.TenCuocThi}</Link></td>
                          <td className="date-cell">{new Date(c.ThoiGianBatDau).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="date-cell">{new Date(c.ThoiGianKetThuc).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="text-center"><span className="count-badge grey">{c.stats?.totalSubmissions || 0}</span></td>
                          <td className="text-center"><span className="count-badge green">{c.stats?.solvedProblems || 0} AC</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {totalContestPages > 1 && (
                  <div className="pagination">
                    <button disabled={contestPage === 1} onClick={() => setContestPage(p => p - 1)} className="p-btn">&laquo;</button>
                    <span className="p-info">Trang {contestPage} / {totalContestPages}</span>
                    <button disabled={contestPage === totalContestPages} onClick={() => setContestPage(p => p + 1)} className="p-btn">&raquo;</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const modernUIStyles = `
  .profile-wrapper { padding: 40px 20px; font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh; }
  .content-constrain { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

  .profile-hero { display: flex; align-items: center; gap: 24px; background: white; padding: 24px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .avatar-container { width: 80px; height: 80px; border-radius: 20px; overflow: hidden; background: #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; }

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
  .accuracy-circle { width: 100px; text-align: center; }
  .circle-label { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; display: block; margin-top: 5px; }
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

  /* Tab Switcher */
  .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
  .tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; }
  .tab-item { padding: 8px 16px; border: none; background: transparent; border-radius: 9px; font-size: 13.5px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
  .tab-item.active { background: white; color: #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

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

  .count-badge { padding: 3px 10px; border-radius: 6px; font-weight: 800; font-size: 12px; }
  .count-badge.grey { background: #f1f5f9; color: #475569; }
  .count-badge.green { background: #dcfce7; color: #15803d; }

  .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
  .p-btn { padding: 5px 12px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
  .p-info { font-size: 13px; color: #64748b; }
  .loader-box { padding: 100px; text-align: center; color: #64748b; }

  .animate-slide { animation: slideUp 0.3s ease-out; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 800px) {
    .main-grid { grid-template-columns: 1fr; }
    .sub-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .search-box-mini { width: 100%; }
    .tab-switcher { width: 100%; }
    .tab-item { flex: 1; }
  }
`;