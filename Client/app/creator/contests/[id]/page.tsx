"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ManageContestPage() {
  const { id } = useParams();
  const router = useRouter();

  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'settings' | 'problems' | 'participants'>('settings');

  // Form States
  const [TenCuocThi, setTenCuocThi] = useState("");
  const [MoTa, setMoTa] = useState("");
  const [ChuY, setChuY] = useState("");
  const [ThoiGianBatDau, setStart] = useState("");
  const [ThoiGianKetThuc, setEnd] = useState("");
  const [TrangThai, setTrangThai] = useState(true);

  // Problem States
  const [availableProblems, setAvailableProblems] = useState<any[]>([]);
  const [contestProblems, setContestProblems] = useState<any[]>([]);

  const [kickModal, setKickModal] = useState<{ show: boolean, userId: string | null, userName: string | null }>({
    show: false, userId: null, userName: null
  });

  useEffect(() => {
    if (id) fetchContestDetail();
  }, [id]);

  const fetchContestDetail = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setContest(data);
        setContestProblems(data.deBais || []);
        setTenCuocThi(data.TenCuocThi);
        setMoTa(data.MoTa);
        setChuY(data.ChuY || "");
        setTrangThai(data.TrangThai);
        setStart(new Date(data.ThoiGianBatDau).toISOString().slice(0, 16));
        setEnd(new Date(data.ThoiGianKetThuc).toISOString().slice(0, 16));
        if (data.IdTaiKhoan) fetchAvailableProblems(data.IdTaiKhoan);
      } else {
        router.push("/creator/contests");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAvailableProblems = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/problems/available?userId=${userId}`);
      if (res.ok) setAvailableProblems(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/contests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenCuocThi, MoTa, ChuY, TrangThai, ThoiGianBatDau, ThoiGianKetThuc })
      });
      if (res.ok) { 
        toast.success("Cập nhật thông tin thành công!"); 
        fetchContestDetail(); 
      } else { 
        toast.error("Cập nhật thất bại."); 
      }
    } catch (e) { toast.error("Lỗi kết nối server."); }
    finally { setSaving(false); }
  };

  const handleAddProblem = async (problem: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/contests/${id}/problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IdDeBai: problem.IdDeBai, TenHienThi: problem.TieuDe })
      });
      if (res.ok) {
        const result = await res.json();
        const newProblem = { ...result, TrangThai: true, deBai: problem };
        setContestProblems(prev => [...prev, newProblem]);
        toast.success(`Đã thêm bài: ${problem.TieuDe}`);
      }
    } catch (e) { toast.error("Lỗi khi thêm bài."); }
  };

  const handleRemoveProblem = async (problem: any) => {
    if (!confirm(`Xóa bài ${problem.deBai?.TieuDe || problem.TenHienThi} khỏi cuộc thi?`)) return;
    try {
        await fetch(`${API_BASE}/api/contests/${id}/problems`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ IdDeBai: problem.IdDeBai })
        });
        setContestProblems(prev => prev.filter(p => p.IdDeBai !== problem.IdDeBai));
        toast.info("Đã xóa bài thi.");
    } catch (e) { toast.error("Lỗi khi xóa bài."); }
  };

  const handleUpdateProblemTitle = async (problemId: string, newTitle: string) => {
      setContestProblems(prev => prev.map(p => p.IdDeBai === problemId ? {...p, TenHienThi: newTitle} : p));
      try {
          await fetch(`${API_BASE}/api/contests/${id}/problems`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ IdDeBai: problemId, TenHienThi: newTitle })
          });
      } catch (e) { console.error(e); }
  };

  const confirmKickUser = async () => {
    if (!kickModal.userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/contests/${id}/kick`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IdTaiKhoan: kickModal.userId })
      });
      if (res.ok) {
        setContest((prev: any) => ({
          ...prev,
          dangKys: prev.dangKys.map((dk: any) => dk.IdTaiKhoan === kickModal.userId ? { ...dk, TrangThai: false } : dk)
        }));
        setKickModal({ show: false, userId: null, userName: null });
        toast.success(`Đã hủy tư cách thi của ${kickModal.userName}`);
      }
    } catch (e) { toast.error("Lỗi khi kick user."); }
  };

  if (loading) return <div className="loading-state">Đang tải dữ liệu...</div>;
  if (!contest) return null;

  const displayedAvailableProblems = availableProblems.filter(av => 
    !contestProblems.some(cp => String(cp.IdDeBai) === String(av.IdDeBai))
  );

  return (
    <div className="manage-page">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <ToastContainer position="top-right" autoClose={2000} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Quản lý Cuộc thi / {contest.TenCuocThi}</div>
          <h1 className="page-title">{contest.TenCuocThi}</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => router.push(`/creator/contests`)}>
            ← Danh sách
          </button>
          <button className="btn btn-primary" onClick={() => window.open(`/contests/${id}`, '_blank')}>
            👁️ Xem trang thi
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ Cài đặt chung
        </button>
        <button className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`} onClick={() => setActiveTab('problems')}>
          📚 Đề thi ({contestProblems.length})
        </button>
        <button className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>
          👥 Thí sinh ({contest.dangKys?.length || 0})
        </button>
      </div>

      {/* CONTENT */}
      <div className="tab-content">
        
        {/* TAB 1: SETTINGS WITH MARKDOWN PREVIEW */}
        {activeTab === 'settings' && (
          <div className="card animate-fade-in">
            <form onSubmit={handleUpdateInfo} className="form-grid">
              <div className="form-group full-width">
                <label className="label">Tên cuộc thi</label>
                <input className="input" value={TenCuocThi} onChange={(e) => setTenCuocThi(e.target.value)} required />
              </div>
              
              <div className="form-group full-width">
                <label className="label">Mô tả (Markdown)</label>
                <div className="markdown-editor-wrapper">
                  <textarea className="textarea" rows={5} value={MoTa} onChange={(e) => setMoTa(e.target.value)} required placeholder="Sử dụng Markdown để định dạng mô tả..." />
                  <div className="markdown-preview-box">
                    <div className="preview-label">Xem trước mô tả</div>
                    <div className="preview-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{MoTa || "*Chưa có mô tả*"}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group full-width">
                <label className="label warning">Lưu ý quan trọng (Markdown)</label>
                <div className="markdown-editor-wrapper">
                  <textarea className="textarea warning-bg" rows={3} value={ChuY} onChange={(e) => setChuY(e.target.value)} placeholder="Nhập các lưu ý quan trọng cho thí sinh..." />
                  <div className="markdown-preview-box warning-border">
                    <div className="preview-label">Xem trước lưu ý</div>
                    <div className="preview-content warning-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{ChuY || "*Chưa có lưu ý*"}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Bắt đầu</label>
                  <input type="datetime-local" className="input" value={ThoiGianBatDau} onChange={(e)=>setStart(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Kết thúc</label>
                  <input type="datetime-local" className="input" value={ThoiGianKetThuc} onChange={(e)=>setEnd(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={TrangThai} onChange={(e) => setTrangThai(e.target.checked)} />
                  <span className="toggle-text">Kích hoạt cuộc thi (Công khai)</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-save" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PROBLEMS */}
        {activeTab === 'problems' && (
          <div className="problems-layout animate-fade-in">
            <div className="panel available-panel">
              <h3 className="panel-title">Kho bài tập ({displayedAvailableProblems.length})</h3>
              <div className="scroll-list">
                {displayedAvailableProblems.length === 0 && <div className="empty-state">Hết bài khả dụng.</div>}
                {displayedAvailableProblems.map(p => (
                  <div key={p.IdDeBai} className="item-card available">
                    <div className="item-info">
                      <span className="item-id">#{p.IdDeBai}</span>
                      <span className="item-name">{p.TieuDe}</span>
                    </div>
                    <button className="btn-icon add" onClick={() => handleAddProblem(p)} title="Thêm vào cuộc thi">+</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel selected-panel">
              <h3 className="panel-title">Đề thi chính thức ({contestProblems.length})</h3>
              <div className="scroll-list">
                {contestProblems.length === 0 && <div className="empty-state">Chưa có đề thi nào.</div>}
                {contestProblems.map((p, index) => (
                  <div key={p.IdDeBai} className="item-card selected">
                    <div className="card-header-row">
                      <span className="badge-index">Bài {index + 1}</span>
                      <button className="btn-text-danger" onClick={() => handleRemoveProblem(p)}>Gỡ bỏ</button>
                    </div>
                    <div className="card-body-row">
                      <div className="original-name">Gốc: {p.deBai?.TieuDe || p.TieuDe}</div>
                      <input 
                        className="input-sm" 
                        value={p.TenHienThi || ""} 
                        onChange={(e) => handleUpdateProblemTitle(p.IdDeBai, e.target.value)}
                        placeholder="Tên hiển thị (VD: Bài A)" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PARTICIPANTS */}
        {activeTab === 'participants' && (
          <div className="card animate-fade-in">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Thí sinh</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {contest.dangKys?.length === 0 && <tr><td colSpan={4} className="empty-cell">Chưa có thí sinh đăng ký.</td></tr>}
                  {contest.dangKys?.map((dk: any) => (
                    <tr key={dk.IdTaiKhoan}>
                      <td className="mono">#{dk.IdTaiKhoan}</td>
                      <td>
                        <div className="user-cell">
                          <div className="avatar">{dk.taiKhoan.HoTen.charAt(0)}</div>
                          <div>
                            <div className="user-name">{dk.taiKhoan.HoTen}</div>
                            <div className="user-sub">@{dk.taiKhoan.TenDangNhap}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${dk.TrangThai ? 'active' : 'inactive'}`}>
                          {dk.TrangThai ? 'Đang tham gia' : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="text-right">
                        {dk.TrangThai && (
                          <button 
                            className="btn-sm btn-danger-outline"
                            onClick={() => setKickModal({ show: true, userId: dk.IdTaiKhoan, userName: dk.taiKhoan.HoTen })}
                          >
                            Hủy tư cách
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL KICK */}
      {kickModal.show && (
        <div className="modal-overlay" onClick={() => setKickModal({ show: false, userId: null, userName: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Xác nhận hủy tư cách thi</h3>
            <p>Bạn có chắc chắn muốn loại thí sinh <b>{kickModal.userName}</b> khỏi cuộc thi này?</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setKickModal({ show: false, userId: null, userName: null })}>Đóng</button>
              <button className="btn btn-danger" onClick={confirmKickUser}>Xác nhận Hủy</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// CSS STYLES
// ==========================================
const pageStyles = `
  .manage-page { max-width: 1100px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, -apple-system, sans-serif; color: #374151; background: #f9fafb; min-height: 100vh; }
  
  /* Header */
  .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
  .breadcrumbs { font-size: 13px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .page-title { font-size: 28px; font-weight: 800; color: #111827; margin: 0; }
  .header-actions { display: flex; gap: 12px; }

  /* Tabs */
  .tabs-container { display: flex; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px; }
  .tab-btn { padding: 12px 20px; background: transparent; border: none; border-bottom: 2px solid transparent; font-weight: 600; color: #6b7280; cursor: pointer; transition: 0.2s; font-size: 15px; margin-bottom: -2px; }
  .tab-btn:hover { color: #2563eb; background: #eff6ff; }
  .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: white; border-top-left-radius: 6px; border-top-right-radius: 6px; }

  /* Card */
  .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 24px; border: 1px solid #e5e7eb; }
  
  /* Form */
  .form-grid { display: grid; gap: 20px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .full-width { width: 100%; }
  
  .label { font-size: 14px; font-weight: 600; color: #374151; }
  .label.warning { color: #b91c1c; }
  .input, .textarea { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box; transition: 0.2s; }
  .input:focus, .textarea:focus { border-color: #2563eb; outline: none; ring: 2px solid #bfdbfe; }
  .warning-bg { background-color: #fef2f2; border-color: #fca5a5; }

  /* Markdown Editor & Preview */
  .markdown-editor-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px; }
  .markdown-preview-box { border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; display: flex; flex-direction: column; max-height: 250px; }
  .warning-border { border-color: #fed7aa; background: #fff7ed; }
  .preview-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; padding: 4px 10px; border-bottom: 1px solid #e5e7eb; background: #fff; border-top-left-radius: 6px; border-top-right-radius: 6px; }
  .preview-content { padding: 10px; overflow-y: auto; font-size: 14px; line-height: 1.5; color: #4b5563; }
  .preview-content p { margin-bottom: 8px; }
  .warning-text { color: #9a3412; }

  .toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
  .toggle-text { font-weight: 500; }

  /* Buttons */
  .btn { padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; border: 1px solid transparent; transition: 0.2s; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-outline { background: white; border-color: #d1d5db; color: #374151; }
  .btn-outline:hover { background: #f3f4f6; }
  .btn-save { background: #059669; color: white; width: 100%; padding: 12px; font-size: 16px; }
  .btn-save:hover { background: #047857; }
  .btn-danger { background: #dc2626; color: white; }
  .btn-danger:hover { background: #b91c1c; }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-danger-outline { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
  .btn-danger-outline:hover { background: #fee2e2; }

  /* Problem Layout */
  .problems-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .panel { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; display: flex; flex-direction: column; height: 500px; }
  .panel-title { padding: 16px; margin: 0; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e5e7eb; background: #f9fafb; color: #374151; }
  .scroll-list { padding: 12px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  
  .item-card { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; transition: 0.2s; }
  .item-card.available:hover { border-color: #2563eb; transform: translateX(2px); }
  .item-info { display: flex; align-items: center; gap: 8px; }
  .item-id { font-family: monospace; font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #6b7280; }
  .item-name { font-weight: 500; font-size: 14px; }
  
  .btn-icon { width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
  .btn-icon.add { background: #eff6ff; color: #2563eb; }
  .btn-icon.add:hover { background: #2563eb; color: white; }

  .item-card.selected { flex-direction: column; align-items: stretch; gap: 8px; border-left: 4px solid #2563eb; }
  .card-header-row { display: flex; justify-content: space-between; align-items: center; }
  .badge-index { font-size: 11px; font-weight: 700; text-transform: uppercase; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 4px; }
  .btn-text-danger { background: none; border: none; color: #dc2626; font-size: 12px; cursor: pointer; text-decoration: underline; }
  .original-name { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .input-sm { width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; box-sizing: border-box; }

  /* Table */
  .table-responsive { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { text-align: left; padding: 12px 16px; background: #f9fafb; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
  .data-table td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; font-size: 14px; }
  .mono { font-family: monospace; color: #6b7280; }
  
  .user-cell { display: flex; align-items: center; gap: 12px; }
  .avatar { width: 32px; height: 32px; background: #bfdbfe; color: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .user-name { font-weight: 600; }
  .user-sub { font-size: 12px; color: #6b7280; }
  
  .status-pill { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .status-pill.active { background: #dcfce7; color: #166534; }
  .status-pill.inactive { background: #fef2f2; color: #991b1b; }
  .text-right { text-align: right; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(2px); }
  .modal-content { background: white; padding: 24px; border-radius: 12px; width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); animation: modalIn 0.2s ease-out; }
  .modal-content h3 { margin-top: 0; font-size: 20px; color: #1f2937; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }

  @keyframes modalIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  
  /* Responsive */
  @media (max-width: 900px) {
    .problems-layout { grid-template-columns: 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .markdown-editor-wrapper { grid-template-columns: 1fr; }
  }
`;