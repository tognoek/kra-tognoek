"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMemory } from "@/scripts/memory";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'submissions' | 'contests'>('submissions');

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subSearch, setSubSearch] = useState("");

  // Contests Search
  const [contestSearch, setContestSearch] = useState("");

  // Password Modal
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdData, setPwdData] = useState({ old: "", new: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

  const router = useRouter();

  const fetchUserStats = useCallback(async (userId: string) => {
    setLoading(true);
    if (typeof document !== "undefined") {
        document.title = `Hồ sơ cá nhân - Kra tognoek`;
    }
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUserStats(data.stats);
        setUser(data);
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
    fetchUserStats(userData.IdTaiKhoan);
  }, [router, fetchUserStats]);

  useEffect(() => {
    if (user?.IdTaiKhoan && activeTab === 'submissions') {
      const delayDebounce = setTimeout(() => {
        fetchSubmissions(user.IdTaiKhoan, subPage, subSearch);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [user?.IdTaiKhoan, subPage, subSearch, fetchSubmissions, activeTab]);

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
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
        const currentLocal = JSON.parse(window.localStorage.getItem("oj_user") || "{}");
        window.localStorage.setItem("oj_user", JSON.stringify({ ...currentLocal, HoTen: data.HoTen }));
        setEditingName(false);
        window.dispatchEvent(new CustomEvent("authChange"));
        toast.success("Cập nhật tên thành công");
      } else {
        setNameError(data.error);
        toast.error(data.error);
      }
    } catch (err) { toast.error("Lỗi kết nối máy chủ"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) return toast.error("Mật khẩu mới không khớp");
    setPwdLoading(true);
    try {
      const token = window.localStorage.getItem("oj_token");
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ IdTaiKhoan: user.IdTaiKhoan, MatKhauCu: pwdData.old, MatKhauMoi: pwdData.new }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Đổi mật khẩu thành công");
        setShowPwdModal(false);
        setPwdData({ old: "", new: "", confirm: "" });
      } else {
        toast.error(data.error);
      }
    } catch (e) { toast.error("Lỗi hệ thống"); }
    finally { setPwdLoading(false); }
  };

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

  // Logic tìm kiếm cuộc thi cục bộ
  const filteredContests = user?.participatedContests?.filter((c: any) => 
    c.TenCuocThi.toLowerCase().includes(contestSearch.toLowerCase())
  ) || [];

  if (!user) return <div className="loader-box">Đang tải hồ sơ...</div>;

  const totalSub = userStats?.totalSubmissions || 0;
  const acSub = userStats?.successfulSubmissions || 0;
  const acRate = totalSub > 0 ? Math.round((acSub / totalSub) * 100) : 0;

  return (
    <div className="profile-wrapper">
      <ToastContainer position="top-right" autoClose={2000} />
      <style dangerouslySetInnerHTML={{ __html: modernUIStyles }} />

      <div className="content-constrain">
        {/* Header Profile - Khôi phục giao diện gốc */}
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
                  />
                  <div className="edit-actions">
                    <button className="btn-icon save" onClick={handleSaveName} disabled={saving}>
                      {saving ? "..." : "✓"}
                    </button>
                    <button className="btn-icon cancel" onClick={() => setEditingName(false)}>✕</button>
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
          <button className="btn-password-trigger" onClick={() => setShowPwdModal(true)}>🔒 Đổi mật khẩu</button>
        </div>

        {/* Stats Grid */}
        <div className="main-grid">
          <div className="glass-card info-card">
            <h3 className="card-title">Thông tin tài khoản</h3>
            <div className="info-row"><span className="info-label">Email</span><span className="info-value truncate-email" title={user.Email}>{user.Email}</span></div>
            <div className="info-row"><span className="info-label">Vai trò</span><span className="info-value">{user.VaiTro}</span></div>
            <div className="info-row"><span className="info-label">Gia nhập</span><span className="info-value">{new Date(user.NgayTao).toLocaleDateString("vi-VN")}</span></div>
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
                <div className="extra-stat-item"><span className="extra-val">{userStats?.participatedContestsCount || 0}</span><span className="extra-lbl">Cuộc thi</span></div>
                <div className="extra-stat-item"><span className="extra-val">{userStats?.totalContests || 0}</span><span className="extra-lbl">Đã tạo</span></div>
                <div className="extra-stat-item"><span className="extra-val">{userStats?.totalProblems || 0}</span><span className="extra-lbl">Đề bài</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search Section */}
        <div className="glass-card history-section">
          <div className="history-header">
            <div className="tab-switcher">
              <button className={`tab-item ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => setActiveTab('submissions')}>
                Lịch sử bài nộp
              </button>
              <button className={`tab-item ${activeTab === 'contests' ? 'active' : ''}`} onClick={() => setActiveTab('contests')}>
                Cuộc thi tham gia
              </button>
            </div>
            <div className="search-box-mini">
              <input 
                type="text" 
                placeholder={activeTab === 'submissions' ? "Tìm tên bài tập..." : "Tìm tên cuộc thi..."} 
                value={activeTab === 'submissions' ? subSearch : contestSearch} 
                onChange={(e) => {
                    if (activeTab === 'submissions') {
                        setSubSearch(e.target.value);
                        setSubPage(1);
                    } else {
                        setContestSearch(e.target.value);
                    }
                }} 
              />
              <span className="search-icon">🔍</span>
            </div>
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
                      <th>Bộ nhớ</th>
                      <th>Ngày nộp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subLoading ? (
                      <tr><td colSpan={5} className="loading-text">Đang tải...</td></tr>
                    ) : submissions.length === 0 ? (
                      <tr><td colSpan={5} className="empty-text">Chưa có bài nộp nào phù hợp.</td></tr>
                    ) : (
                      submissions.map((s) => (
                        <tr key={s.IdBaiNop}>
                          <td>
                            <Link href={`/problems/${s.IdDeBai}`} className="p-link">{s.deBai?.TieuDe}</Link>
                            {s.cuocThi && <div className="contest-small-tag">🏆 {s.cuocThi.TenCuocThi}</div>}
                          </td>
                          <td>{getStatusUI(s.TrangThaiCham)}</td>
                          <td>{s.ThoiGianThucThi}ms</td>
                          <td>{formatMemory(s.BoNhoSuDung)}</td>
                          <td className="date-cell">{new Date(s.NgayNop).toLocaleDateString("vi-VN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Khôi phục UI Phân trang cũ */}
                {subTotalPages > 1 && (
                  <div className="pagination">
                    <button disabled={subPage === 1} onClick={() => setSubPage(p => p - 1)} className="p-btn">«</button>
                    <span className="p-info">Trang {subPage} / {subTotalPages}</span>
                    <button disabled={subPage === subTotalPages} onClick={() => setSubPage(p => p + 1)} className="p-btn">»</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="table-wrapper animate-slide">
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Tên cuộc thi</th>
                      <th>Ngày diễn ra</th>
                      <th>Kết thúc</th>
                      <th className="text-center">Bài nộp</th>
                      <th className="text-center">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContests.length === 0 ? (
                      <tr><td colSpan={5} className="empty-text">Không tìm thấy cuộc thi nào.</td></tr>
                    ) : (
                      filteredContests.map((c: any) => (
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Đổi mật khẩu */}
      {showPwdModal && (
        <div className="modal-overlay">
           <div className="modal-container animate-pop">
              <div className="modal-header-p">
                 <h3>🔐 Đổi mật khẩu</h3>
                 <button className="close-x" onClick={() => setShowPwdModal(false)}>✕</button>
              </div>
              <form onSubmit={handleChangePassword}>
                 <div className="p-group">
                    <label>Mật khẩu hiện tại</label>
                    <input type="password" required value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} />
                 </div>
                 <div className="p-group">
                    <label>Mật khẩu mới</label>
                    <input type="password" required value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} />
                 </div>
                 <div className="p-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <input type="password" required value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} />
                 </div>
                 <div className="modal-btn-row">
                    <button type="button" className="btn-s2" onClick={() => setShowPwdModal(false)}>Hủy</button>
                    <button type="submit" className="btn-p2" disabled={pwdLoading}>{pwdLoading ? "Đang lưu..." : "Lưu thay đổi"}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

const modernUIStyles = `
  .profile-wrapper { padding: 40px 20px; font-family: 'Inter', sans-serif; min-height: 100vh; }
  .content-constrain { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

  /* Hero Section */
  .profile-hero { display: flex; align-items: center; gap: 24px; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); border: 1px solid #fff; position: relative; }
  .avatar-container { width: 90px; height: 90px; border-radius: 24px; overflow: hidden; background: #eee; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; }
  
  .user-fullname { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 12px; }
  .edit-trigger { background: none; border: none; padding: 6px; cursor: pointer; border-radius: 8px; transition: 0.2s; color: #94a3b8; }
  .edit-trigger:hover { background: #f1f5f9; color: #667eea; }
  .input-group { display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 4px; border-radius: 12px; border: 2px solid #e2e8f0; }
  .edit-input { border: none; background: transparent; font-size: 24px; font-weight: 800; outline: none; padding-left: 10px; width: 250px; }
  .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; }
  .btn-icon.save { background: #1e293b; color: #fff; } .btn-icon.cancel { background: #f1f5f9; color: #64748b; }
  .user-handle { font-size: 15px; color: #64748b; margin-top: 6px; }
  .role-badge { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }

  .btn-password-trigger { margin-left: auto; padding: 10px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; font-size: 13px; }
  .btn-password-trigger:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

  /* Info Cards */
  .main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
  .glass-card { background: white; padding: 24px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .card-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 20px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
  .info-label { color: #64748b; } .info-value { color: #1e293b; font-weight: 600; }
  .truncate-email { max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }

  /* Accuracy Stats */
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

  .extra-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
  .extra-stat-item { background: #f8fafc; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #f1f5f9; }
  .extra-val { display: block; font-size: 18px; font-weight: 800; color: #1e293b; }
  .extra-lbl { font-size: 11px; color: #64748b; font-weight: 600; line-height: 1.2; display: block; margin-top: 2px; }

  /* History Section */
  .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
  .tab-switcher { display: flex; background: #f1f5f9; padding: 4px; border-radius: 14px; gap: 4px; }
  .tab-item { padding: 10px 20px; border: none; background: transparent; border-radius: 10px; font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
  .tab-item.active { background: white; color: #2563eb; box-shadow: 0 4px 10px -2px rgba(0,0,0,0.05); }

  .search-box-mini { position: relative; width: 250px; }
  .search-box-mini input { width: 100%; padding: 10px 35px 10px 15px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; }
  .search-icon { position: absolute; right: 12px; top: 10px; font-size: 14px; opacity: 0.4; }

  .sub-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .sub-table th { text-align: left; padding: 15px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; }
  .sub-table td { padding: 15px; border-bottom: 1px solid #f8fafc; }
  .p-link { color: #2563eb; font-weight: 700; text-decoration: none; }
  .contest-small-tag { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 4px; }
  .st-badge { padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; display: inline-block; }
  .st-badge.accepted { background: #dcfce7; color: #15803d; }
  .st-badge.error { background: #fee2e2; color: #b91c1c; }
  .st-badge.pending { background: #fefce8; color: #a16207; }

  /* Phân trang - Khôi phục chuẩn */
  .pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
  .p-btn { padding: 6px 14px; border: 1px solid #e2e8f0; background: white; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px; }
  .p-info { font-size: 13px; color: #64748b; font-weight: 600; }

  /* Modal Đổi mật khẩu */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
  .modal-container { background: white; width: 400px; padding: 32px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
  .modal-header-p { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .modal-header-p h3 { font-size: 20px; font-weight: 800; margin: 0; }
  .close-x { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
  .p-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .p-group label { font-size: 13px; font-weight: 700; color: #64748b; }
  .p-group input { padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 15px; outline: none; transition: 0.2s; }
  .p-group input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
  .modal-btn-row { display: flex; gap: 12px; margin-top: 24px; }
  .btn-p2 { flex: 1; padding: 12px; border: none; background: #2563eb; color: white; border-radius: 12px; font-weight: 700; cursor: pointer; }
  .btn-s2 { flex: 1; padding: 12px; border: none; background: #f1f5f9; color: #64748b; border-radius: 12px; font-weight: 700; cursor: pointer; }

  .animate-slide { animation: slideIn 0.3s ease-out; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-pop { animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  @keyframes pop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  .loader-box { padding: 100px; text-align: center; color: #64748b; }
`;