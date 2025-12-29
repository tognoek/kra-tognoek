"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CryptoJS from "crypto-js"; // Cần cài đặt: npm install crypto-js

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subSearch, setSubSearch] = useState("");

  const router = useRouter();

  const fetchUserStats = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUserStats(data.stats);
        setUser((prev: any) => ({ ...prev, ...data }));
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
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
    const userStr = window.localStorage.getItem("oj_user");
    if (!userStr) {
      router.push("/auth/login");
      return;
    }
    const userData = JSON.parse(userStr);
    setUser(userData);
    fetchUserStats(userData.IdTaiKhoan);
  }, [router, fetchUserStats]);

  useEffect(() => {
    if (user?.IdTaiKhoan) {
      const delayDebounce = setTimeout(() => {
        fetchSubmissions(user.IdTaiKhoan, subPage, subSearch);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [user?.IdTaiKhoan, subPage, subSearch, fetchSubmissions]);

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    if (newName.trim() === user.HoTen) {
      setEditingName(false);
      return;
    }

    setSaving(true);
    setNameError(null);
    try {
      const token = window.localStorage.getItem("oj_token");
      const res = await fetch(`${API_BASE}/api/users/${user.IdTaiKhoan}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ HoTen: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, HoTen: data.HoTen }));
        window.localStorage.setItem("oj_user", JSON.stringify({ ...user, HoTen: data.HoTen }));
        setEditingName(false);
        window.dispatchEvent(new CustomEvent("authChange"));
      } else {
        setNameError(data.error || "Không thể cập nhật tên");
      }
    } catch (err) { 
      setNameError("Lỗi kết nối máy chủ"); 
    } finally { 
      setSaving(false); 
    }
  };

  const getStatusClass = (status: string | null) => {
    if (!status) return "pending";
    if (status === "accepted") return "accepted";
    return "rejected";
  };

  if (!user) return <div className="loader-box">Đang tải hồ sơ...</div>;

  const totalSub = userStats?.totalSubmissions || 0;
  const acSub = userStats?.successfulSubmissions || 0;
  const acRate = totalSub > 0 ? Math.round((acSub / totalSub) * 100) : 0;

  return (
    <div className="profile-wrapper">
      <style dangerouslySetInnerHTML={{ __html: modernUIStyles }} />

      <div className="content-constrain">
        {/* Header Profile */}
        <div className="profile-hero">
          <div className="avatar-container">
             <img src={user.Avatar} alt="avatar" className="avatar-img" />
          </div>
          <div className="hero-info">
            {editingName ? (
              <div className="name-edit-container">
                <div className={`input-group ${nameError ? 'has-error' : ''}`}>
                  <input 
                    className="edit-input" 
                    value={newName} 
                    onChange={(e) => {setNewName(e.target.value); setNameError(null);}} 
                    autoFocus 
                    onKeyDown={(e) => {
                      if(e.key === 'Enter') handleSaveName();
                      if(e.key === 'Escape') setEditingName(false);
                    }}
                  />
                  <div className="edit-actions">
                    <button className="btn-icon save" onClick={handleSaveName} title="Lưu" disabled={saving}>
                      {saving ? <span className="loader-mini"></span> : "✓"}
                    </button>
                    <button className="btn-icon cancel" onClick={() => setEditingName(false)} title="Hủy">✕</button>
                  </div>
                </div>
                {nameError && <span className="error-msg">{nameError}</span>}
              </div>
            ) : (
              <h1 className="user-fullname">
                {user.HoTen}
                <button className="edit-trigger" onClick={() => {setEditingName(true); setNewName(user.HoTen)}}>
                  <span className="edit-icon">✏️</span>
                </button>
              </h1>
            )}
            <p className="user-handle">@{user.TenDangNhap} • <span className="role-badge">{user.VaiTro}</span></p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          <div className="glass-card info-card">
            <h3 className="card-title">Thông tin tài khoản</h3>
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{user.Email}</span></div>
            <div className="info-row"><span className="info-label">Vai trò</span><span className="info-value">{user.VaiTro}</span></div>
            <div className="info-row">
              <span className="info-label">Ngày gia nhập</span>
              <span className="info-value">
                {user.NgayTao ? new Date(user.NgayTao).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
              </span>
            </div>
            <div className="info-row"><span className="info-label">Trạng thái</span><span className="info-value text-green">Đang hoạt động</span></div>
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
                  <div className="stat-mini"><span className="dot ac"></span> Thành công: <strong>{acSub}</strong></div>
                  <div className="stat-mini"><span className="dot total"></span> Tổng bài: <strong>{totalSub}</strong></div>
                </div>
              </div>

              <div className="extra-stats-grid">
                <div className="extra-stat-item">
                  <span className="extra-val">{userStats?.participatedContests || 0}</span>
                  <span className="extra-lbl">Cuộc thi tham gia</span>
                </div>
                <div className="extra-stat-item">
                  <span className="extra-val">{userStats?.totalContests || 0}</span>
                  <span className="extra-lbl">Cuộc thi đã tạo</span>
                </div>
                <div className="extra-stat-item">
                  <span className="extra-val">{userStats?.totalProblems || 0}</span>
                  <span className="extra-lbl">Đề bài đã tạo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lịch sử bài nộp */}
        <div className="glass-card sub-section">
          <div className="sub-header">
            <h3 className="card-title">Lịch sử bài nộp</h3>
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
                  <th>Bộ nhớ</th>
                  <th>Ngày nộp</th>
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  <tr><td colSpan={5} className="loading-text">Đang tải bài nộp...</td></tr>
                ) : submissions.length === 0 ? (
                  <tr><td colSpan={5} className="empty-text">Chưa có bài nộp nào phù hợp.</td></tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s.IdBaiNop}>
                      <td><Link href={`/problems/${s.IdDeBai}`} className="p-link">{s.deBai?.TieuDe}</Link></td>
                      <td><span className={`st-badge ${getStatusClass(s.TrangThaiCham)}`}>{s.TrangThaiCham || "Pending"}</span></td>
                      <td>{s.ThoiGianThucThi}ms</td>
                      <td>{s.BoNhoSuDung} kb</td>
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

  /* Hero Section */
  .profile-hero { display: flex; align-items: center; gap: 24px; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); border: 1px solid #fff; }
  
  .avatar-container { width: 90px; height: 90px; border-radius: 24px; overflow: hidden; background: #eee; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; }
  
  /* NAME EDITING STYLES */
  .user-fullname { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 12px; }
  .edit-trigger { background: none; border: none; padding: 6px; cursor: pointer; border-radius: 8px; transition: 0.2s; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
  .edit-trigger:hover { background: #f1f5f9; color: #667eea; }
  .edit-icon { font-size: 20px; line-height: 1; }

  .name-edit-container { display: flex; flex-direction: column; gap: 6px; }
  .input-group { display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 4px 4px 4px 12px; border-radius: 12px; border: 2px solid #e2e8f0; transition: 0.2s; width: fit-content; }
  .input-group:focus-within { border-color: #667eea; background: #fff; box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1); }
  .input-group.has-error { border-color: #ef4444; }
  
  .edit-input { border: none; background: transparent; font-size: 24px; font-weight: 800; color: #1e293b; outline: none; width: 300px; }
  .edit-actions { display: flex; gap: 4px; }
  .btn-icon { width: 36px; height: 36px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; transition: 0.2s; }
  .btn-icon.save { background: #1e293b; color: #fff; }
  .btn-icon.save:hover { background: #0f172a; }
  .btn-icon.cancel { background: #f1f5f9; color: #64748b; }
  .btn-icon.cancel:hover { background: #e2e8f0; }
  .error-msg { font-size: 12px; color: #ef4444; font-weight: 600; padding-left: 4px; }

  .user-handle { font-size: 15px; color: #64748b; margin-top: 6px; }
  .role-badge { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }

  /* Main Grid */
  .main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: stretch; }
  .glass-card { background: white; padding: 24px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }

  .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
  .info-label { color: #64748b; }
  .info-value { color: #1e293b; font-weight: 600; }

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

  .extra-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
  .extra-stat-item { background: #f8fafc; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #f1f5f9; }
  .extra-val { display: block; font-size: 18px; font-weight: 800; color: #1e293b; }
  .extra-lbl { font-size: 11px; color: #64748b; font-weight: 600; line-height: 1.2; display: block; margin-top: 2px; }

  .sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .search-box-mini { position: relative; width: 250px; }
  .search-box-mini input { width: 100%; padding: 8px 35px 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
  .search-icon { position: absolute; right: 10px; top: 8px; font-size: 14px; opacity: 0.4; }

  .table-wrapper { overflow-x: auto; }
  .sub-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .sub-table th { text-align: left; padding: 12px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; }
  .sub-table td { padding: 12px; border-bottom: 1px solid #f8fafc; }
  .p-link { color: #2563eb; font-weight: 600; text-decoration: none; }
  .st-badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  .st-badge.accepted { background: #dcfce7; color: #15803d; }
  .st-badge.rejected { background: #fee2e2; color: #b91c1c; }
  .st-badge.pending { background: #fefce8; color: #a16207; }

  .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; }
  .p-btn { padding: 5px 12px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
  .loader-mini { width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  @media (max-width: 800px) {
    .main-grid { grid-template-columns: 1fr; }
    .accuracy-container { flex-direction: row; justify-content: center; }
    .extra-stats-grid { grid-template-columns: 1fr 1fr; }
    .edit-input { width: 100%; }
  }
`;