"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ToastContainer, toast, Slide } from 'react-toastify';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import CryptoJS from "crypto-js";
import 'react-toastify/dist/ReactToastify.css';
import 'highlight.js/styles/github.css'; 
import 'katex/dist/katex.min.css';

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

  // Modals States
  const [kickModal, setKickModal] = useState<{ show: boolean, userId: string | null, userName: string | null }>({
    show: false, userId: null, userName: null
  });
  const [removeProbModal, setRemoveProbModal] = useState<{ show: boolean, problem: any | null }>({
    show: false, problem: null
  });

  const fetchContestDetail = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/creator_contest/contests/${id}`);
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
  }, [id, router]);

  useEffect(() => {
    if (id) fetchContestDetail();
  }, [id, fetchContestDetail]);

  const fetchAvailableProblems = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/creator_problem/available?userId=${userId}`);
      if (res.ok) setAvailableProblems(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Đang lưu thay đổi...");
    try {
      const res = await fetch(`${API_BASE}/api/creator_contest/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenCuocThi, MoTa, ChuY, TrangThai, ThoiGianBatDau, ThoiGianKetThuc })
      });
      if (res.ok) { 
        toast.update(toastId, { render: "Cập nhật thành công!", type: "success", isLoading: false, autoClose: 1500 });
        fetchContestDetail(); 
      } else { 
        toast.update(toastId, { render: "Cập nhật thất bại.", type: "error", isLoading: false, autoClose: 2000 });
      }
    } catch (e) { toast.update(toastId, { render: "Lỗi kết nối server.", type: "error", isLoading: false, autoClose: 2000 }); }
    finally { setSaving(false); }
  };

  const handleAddProblem = async (problem: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/creator_contest/${id}/problems`, {
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

  const confirmRemoveProblem = async () => {
    const { problem } = removeProbModal;
    if (!problem) return;
    try {
        await fetch(`${API_BASE}/api/creator_contest/${id}/problems`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ IdDeBai: problem.IdDeBai })
        });
        setContestProblems(prev => prev.filter(p => p.IdDeBai !== problem.IdDeBai));
        toast.info("Đã gỡ bài thi khỏi danh sách.");
        setRemoveProbModal({ show: false, problem: null });
    } catch (e) { toast.error("Lỗi khi gỡ bài."); }
  };

  const handleUpdateProblemTitle = async (problemId: string, newTitle: string) => {
      setContestProblems(prev => prev.map(p => p.IdDeBai === problemId ? {...p, TenHienThi: newTitle} : p));
      try {
          await fetch(`${API_BASE}/api/creator_contest/${id}/problems`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ IdDeBai: problemId, TenHienThi: newTitle })
          });
      } catch (e) { console.error(e); }
  };

  const confirmKickUser = async () => {
    if (!kickModal.userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/creator_contest/${id}/kick`, {
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
    } catch (e) { toast.error("Lỗi khi truất quyền."); }
  };

  if (loading) return <div className="loading-state">⌛ Đang tải dữ liệu cuộc thi...</div>;
  if (!contest) return null;
  const displayedAvailableProblems = availableProblems.filter(av => 
    !contestProblems.some(cp => String(cp.IdDeBai) === String(av.IdDeBai))
  );

  return (
    <div className="manage-page">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <ToastContainer position="top-right" autoClose={2000} transition={Slide} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Hệ thống / Creator / Quản lý Cuộc thi</div>
          <h1 className="page-title">⚙️ {contest.TenCuocThi}</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => router.push(`/creator/contests`)}>
            ← Danh sách
          </button>
          <button className="btn btn-primary" onClick={() => window.open(`/contests/${id}`, '_blank')}>
            👁️ Trang thi đấu
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          🛠️ Cài đặt chung
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
        
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <div className="main-card">
              <form onSubmit={handleUpdateInfo} className="form-grid p-40">
                <div className="form-group full-width">
                  <label className="label">Tên cuộc thi</label>
                  <input className="input" value={TenCuocThi} onChange={(e) => setTenCuocThi(e.target.value)} required />
                </div>
                
                <div className="form-group full-width">
                  <label className="label">Mô tả (Markdown)</label>
                  <div className="editor-layout-sync">
                    <textarea className="textarea" rows={6} value={MoTa} onChange={(e) => setMoTa(e.target.value)} required placeholder="Mô tả cuộc thi..." />
                    <div className="markdown-preview-box">
                      <div className="preview-label">Xem trước nội dung</div>
                      <div className="preview-content markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}>
                          {MoTa || "*Chưa có nội dung mô tả*"}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="label warning-text-color">⚠️ Quy định & Lưu ý (Markdown)</label>
                  <div className="editor-layout-sync">
                    <textarea className="textarea warning-border" rows={4} value={ChuY} onChange={(e) => setChuY(e.target.value)} placeholder="Các quy định quan trọng..." />
                    <div className="markdown-preview-box warning-preview-bg">
                      <div className="preview-label">Xem trước lưu ý</div>
                      <div className="preview-content markdown-body warning-text">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}>
                          {ChuY || "*Chưa có ghi chú nào*"}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row-2-cols">
                  <div className="form-group">
                    <label className="label">Thời gian bắt đầu</label>
                    <input type="datetime-local" className="input" value={ThoiGianBatDau} onChange={(e)=>setStart(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Thời gian kết thúc</label>
                    <input type="datetime-local" className="input" value={ThoiGianKetThuc} onChange={(e)=>setEnd(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group p-top-20">
                  <label className="toggle-label">
                    <input type="checkbox" checked={TrangThai} onChange={(e) => setTrangThai(e.target.checked)} />
                    <span className="toggle-text">Công khai cuộc thi (Cho phép thí sinh tìm thấy và tham gia)</span>
                  </label>
                </div>

                <div className="form-footer">
                  <button type="submit" className="btn btn-save" disabled={saving}>
                    {saving ? "⌛ Đang lưu..." : "💾 Lưu mọi thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="problems-layout animate-fade-in">
            <div className="panel">
              <h3 className="panel-title">📦 Kho bài tập của bạn ({displayedAvailableProblems.length})</h3>
              <div className="scroll-list">
                {displayedAvailableProblems.length === 0 && <div className="empty-state">Hết bài tập khả dụng.</div>}
                {displayedAvailableProblems.map(p => (
                  <div key={p.IdDeBai} className="item-card available">
                    <div className="item-info">
                      <span className="item-id">#{p.IdDeBai}</span>
                      <span className="item-name">{p.TieuDe}</span>
                    </div>
                    <button className="btn-icon add" onClick={() => handleAddProblem(p)} title="Đưa vào đề thi">+</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h3 className="panel-title">🏁 Đề thi chính thức ({contestProblems.length} bài)</h3>
              <div className="scroll-list">
                {contestProblems.length === 0 && <div className="empty-state">Chưa chọn bài nào cho đề thi.</div>}
                {contestProblems.map((p, index) => (
                  <div key={p.IdDeBai} className="item-card selected">
                    <div className="card-header-row">
                      <span className="badge-index">Bài {String.fromCharCode(65 + index)}</span>
                      <button 
                        className="btn-remove-text" 
                        onClick={() => setRemoveProbModal({ show: true, problem: p })}
                      >
                        ✕ Gỡ bỏ
                      </button>
                    </div>
                    <div className="card-body-row">
                      <div className="original-name-sub">Tên gốc: {p.deBai?.TieuDe || p.TieuDe}</div>
                      <input 
                        className="input-sm" 
                        value={p.TenHienThi || ""} 
                        onChange={(e) => handleUpdateProblemTitle(p.IdDeBai, e.target.value)}
                        placeholder="Tên hiển thị trong kỳ thi" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="animate-fade-in">
             <div className="main-card overflow-hidden">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{width: '100px'}}>ID</th>
                        <th>Thí sinh tham gia</th>
                        <th style={{width: '200px'}}>Trạng thái</th>
                        <th style={{width: '150px'}} className="text-right">Quản lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contest.dangKys?.length === 0 ? (
                        <tr><td colSpan={4} className="empty-cell">Chưa có thí sinh nào đăng ký.</td></tr>
                      ) : (
                        contest.dangKys?.map((dk: any) => (
                          <tr key={dk.IdTaiKhoan}>
                            <td className="mono-font">#{dk.IdTaiKhoan}</td>
                            <td>
                              <div className="user-cell">
                                <div className="avatar-sync">
                                    <img src={dk.taiKhoan.Avatar} alt="avt" className="avatar-img-sync" />
                                </div>
                                <div>
                                  <div className="user-fullname-sync">{dk.taiKhoan.HoTen}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${dk.TrangThai ? 'active' : 'inactive'}`}>
                                {dk.TrangThai ? 'Hợp lệ' : 'Bị loại / Đã hủy'}
                              </span>
                            </td>
                            <td className="text-right">
                              {dk.TrangThai && (
                                <button className="btn-sm btn-kick" onClick={() => setKickModal({ show: true, userId: dk.IdTaiKhoan, userName: dk.taiKhoan.HoTen })}>
                                  Truất quyền
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* MODAL KICK USER */}
      {kickModal.show && (
        <div className="modal-overlay" onClick={() => setKickModal({ show: false, userId: null, userName: null })}>
          <div className="modal-content animate-pop" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title-danger">Truất quyền thi đấu?</h3>
            <p className="modal-body-text">Bạn có chắc chắn muốn hủy tư cách dự thi của <b>{kickModal.userName}</b>? <br/>Thí sinh này sẽ không thể nộp bài trong cuộc thi này nữa.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setKickModal({ show: false, userId: null, userName: null })}>Hủy bỏ</button>
              <button className="btn btn-danger" onClick={confirmKickUser}>Xác nhận loại</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REMOVE PROBLEM */}
      {removeProbModal.show && (
        <div className="modal-overlay" onClick={() => setRemoveProbModal({ show: false, problem: null })}>
          <div className="modal-content animate-pop" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title-danger">Gỡ bài thi?</h3>
            <p className="modal-body-text">
                Xác nhận gỡ bài <b>{removeProbModal.problem?.deBai?.TieuDe || removeProbModal.problem?.TenHienThi}</b> khỏi đề thi? 
                <br/>Các bài nộp của thí sinh cho đề này vẫn sẽ được giữ lại trong hệ thống.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setRemoveProbModal({ show: false, problem: null })}>Quay lại</button>
              <button className="btn btn-danger" onClick={confirmRemoveProblem}>Xác nhận gỡ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const pageStyles = `
  .manage-page { max-width: 1200px; margin: 20px auto 60px; padding: 0 20px; font-family: 'Inter', system-ui, sans-serif; color: #374151; }
  
  .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
  .breadcrumbs { font-size: 13px; color: #94a3b8; margin-bottom: 6px; font-weight: 600; }
  .page-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
  .header-actions { display: flex; gap: 12px; }

  .tabs-container { display: flex; gap: 8px; border-bottom: 2px solid #f1f5f9; margin-bottom: 32px; }
  .tab-btn { padding: 14px 24px; background: transparent; border: none; border-bottom: 2px solid transparent; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; font-size: 15px; }
  .tab-btn:hover { color: #2563eb; background: #f8fafc; border-radius: 12px 12px 0 0; }
  .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

  .main-card { background: white; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; }
  .p-40 { padding: 40px; }
  .overflow-hidden { overflow: hidden; }
  
  .form-grid { display: flex; flex-direction: column; gap: 32px; }
  .row-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .full-width { width: 100%; }
  
  .label { font-size: 12px; font-weight: 800; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; }
  .warning-text-color { color: #e11d48; }
  .input, .textarea { padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 15px; width: 100%; box-sizing: border-box; transition: 0.2s; outline: none; background: #fcfdfe; }
  .input:focus, .textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.08); background: white; }

  .editor-layout-sync { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .markdown-preview-box { border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; display: flex; flex-direction: column; }
  .preview-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; padding: 8px 16px; border-bottom: 1px solid #e2e8f0; background: white; border-radius: 14px 14px 0 0; }
  .preview-content { padding: 20px; font-size: 14px; line-height: 1.7; color: #334155; }
  .warning-border { border-color: #fecaca; }
  .warning-preview-bg { background: #fffcfc; border-color: #fecaca; }

  .toggle-label { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 18px; background: #f8fafc; border-radius: 16px; border: 2px dashed #e2e8f0; transition: 0.2s; }
  .toggle-label:hover { border-color: #2563eb; background: #f0f7ff; }
  .toggle-text { font-weight: 700; font-size: 14px; color: #1e293b; }

  .problems-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; min-height: 600px; }
  .panel { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; }
  .panel-title { padding: 24px; margin: 0; font-size: 16px; font-weight: 800; background: #fcfdfe; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  .scroll-list { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }
  
  .item-card { display: flex; justify-content: space-between; align-items: center; padding: 18px; border-radius: 16px; border: 1px solid #f1f5f9; background: white; transition: 0.2s; }
  .item-card.available:hover { border-color: #2563eb; transform: translateX(8px); box-shadow: 0 10px 15px -3px rgba(37,99,235,0.1); }
  .item-id { font-family: ui-monospace, monospace; font-size: 11px; background: #f1f5f9; padding: 4px 8px; border-radius: 8px; color: #64748b; font-weight: 700; }
  .item-name { font-weight: 700; color: #1e293b; margin-left: 10px; }
  
  .btn-icon.add { width: 36px; height: 36px; border-radius: 12px; background: #2563eb; color: white; border: none; font-size: 20px; cursor: pointer; transition: 0.2s; }
  .btn-icon.add:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }

  .item-card.selected { flex-direction: column; align-items: stretch; border-left: 6px solid #2563eb; background: #f8faff; gap: 12px; }
  .card-header-row { display: flex; justify-content: space-between; align-items: center; }
  .badge-index { font-size: 10px; font-weight: 900; text-transform: uppercase; background: #1e293b; color: white; padding: 4px 12px; border-radius: 8px; }
  .btn-remove-text { background: #fee2e2; border: none; color: #b91c1c; font-size: 11px; font-weight: 800; cursor: pointer; padding: 4px 10px; border-radius: 8px; transition: 0.2s; }
  .btn-remove-text:hover { background: #fecaca; }
  .original-name-sub { font-size: 11px; color: #94a3b8; font-weight: 600; }
  .input-sm { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; width: 100%; outline: none; background: white; font-weight: 600; }
  .input-sm:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.05); }

  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { text-align: left; padding: 20px 24px; background: #fcfdfe; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 900; letter-spacing: 1px; border-bottom: 1px solid #f1f5f9; }
  .data-table td { padding: 20px 24px; border-bottom: 1px solid #f8faff; vertical-align: middle; font-size: 14px; }
  .mono-font { font-family: ui-monospace, monospace; color: #94a3b8; font-weight: 600; font-size: 12px; }
  
  .user-cell { display: flex; align-items: center; gap: 15px; }
  .avatar-sync { width: 40px; height: 40px; background: #f1f5f9; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
  .avatar-img-sync { width: 100%; height: 100%; object-fit: cover; }
  .user-fullname-sync { font-weight: 800; color: #1e293b; font-size: 15px; }
  .user-subname-sync { font-size: 12px; color: #94a3b8; font-weight: 500; }
  
  .status-pill { padding: 6px 12px; border-radius: 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-pill.active { background: #dcfce7; color: #15803d; }
  .status-pill.inactive { background: #fee2e2; color: #b91c1c; }
  .btn-kick { background: white; color: #e11d48; border: 1px solid #fecdd3; padding: 8px 14px; border-radius: 10px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
  .btn-kick:hover { background: #e11d48; color: white; border-color: #e11d48; }

  .btn { padding: 14px 28px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-size: 14px; }
  .btn-primary { background: #2563eb; color: white; box-shadow: 0 10px 15px -3px rgba(37,99,235,0.2); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-3px); box-shadow: 0 20px 25px -5px rgba(37,99,235,0.3); }
  .btn-outline { background: white; border: 1px solid #e2e8f0; color: #475569; }
  .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
  .btn-save { background: #0f172a; color: white; width: 100%; font-size: 16px; }
  .btn-save:hover { background: #000000; transform: translateY(-2px); }
  .btn-danger { background: #e11d48; color: white; }
  .btn-danger:hover { background: #be123c; transform: translateY(-2px); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(8px); }
  .modal-content { background: white; padding: 40px; border-radius: 32px; width: 100%; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #f1f5f9; }
  .modal-title-danger { color: #0f172a; margin: 0 0 16px; font-size: 24px; font-weight: 900; text-align: center; }
  .modal-body-text { color: #64748b; line-height: 1.6; margin-bottom: 32px; text-align: center; font-size: 15px; }
  .modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .animate-pop { animation: popIn 0.3s cubic-bezier(0.17, 0.89, 0.32, 1.28); }
  @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  .loading-state { text-align: center; padding: 120px; font-size: 18px; color: #94a3b8; font-weight: 700; }
  .animate-fade-in { animation: fadeIn 0.5s ease-out; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 900px) {
    .row-2-cols, .editor-layout-sync, .problems-layout { grid-template-columns: 1fr; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 20px; }
  }
`;