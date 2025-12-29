"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'highlight.js/styles/github.css'; 
import 'katex/dist/katex.min.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

interface ProblemSimple {
  IdDeBai: string;
  TieuDe: string;
  DoKho: string;
}

interface SelectedProblem {
  IdDeBai: string;
  OriginalTitle: string;
  TenHienThi: string;
}

export default function CreateContestPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [TenCuocThi, setTenCuocThi] = useState("");
  const [MoTa, setMoTa] = useState("");
  const [ChuY, setChuY] = useState("");
  const [ThoiGianBatDau, setStart] = useState("");
  const [ThoiGianKetThuc, setEnd] = useState("");

  // Logic chọn đề bài
  const [availableProblems, setAvailableProblems] = useState<ProblemSimple[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("oj_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        fetchAvailableProblems(parsed.IdTaiKhoan);
      } catch (e) {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const fetchAvailableProblems = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/creator_problem/available?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableProblems(data);
      }
    } catch (e) { console.error(e); }
  };

  const isAdmin = user?.VaiTro?.toLowerCase() === "admin";
  const isCreator = user?.VaiTro?.toLowerCase() === "creator" || isAdmin;

  const handleAddProblem = (p: ProblemSimple) => {
    if (selectedProblems.find((sp) => sp.IdDeBai === p.IdDeBai)) return;
    setSelectedProblems([
      ...selectedProblems,
      { IdDeBai: p.IdDeBai, OriginalTitle: p.TieuDe, TenHienThi: p.TieuDe },
    ]);
  };

  const handleRemoveProblem = (id: string) => {
    setSelectedProblems(selectedProblems.filter((p) => p.IdDeBai !== id));
  };

  const handleUpdateDisplayTitle = (id: string, newTitle: string) => {
    setSelectedProblems(selectedProblems.map((p) => p.IdDeBai === id ? { ...p, TenHienThi: newTitle } : p));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isCreator) return;

    if (selectedProblems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 bài tập!");
      return;
    }

    const toastId = toast.loading("Đang khởi tạo cuộc thi...");
    try {
      setSaving(true);
      setError(null);

      const problemsPayload = selectedProblems.map((p) => ({
        IdDeBai: p.IdDeBai,
        TenHienThi: p.TenHienThi || p.OriginalTitle,
      }));

      const res = await fetch(`${API_BASE}/api/creator_contest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: Number(user.IdTaiKhoan),
          TenCuocThi, MoTa, ChuY, ThoiGianBatDau, ThoiGianKetThuc,
          problems: problemsPayload,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Tạo cuộc thi thất bại");
      
      toast.update(toastId, { render: "Tạo cuộc thi thành công!", type: "success", isLoading: false, autoClose: 1500 });
      setTimeout(() => router.push("/creator/contests"), 1500);
    } catch (e: any) {
      toast.update(toastId, { render: e.message || "Lỗi server", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailableProblems = availableProblems.filter(
    (p) => !selectedProblems.some((sp) => String(sp.IdDeBai) === String(p.IdDeBai))
  );

  if (loading) return <div className="loading-state">⌛ Đang nạp tài nguyên...</div>;
  if (!isCreator) return <div className="access-denied"><h3>🚫 Bạn không có quyền truy cập.</h3></div>;

  return (
    <div className="create-contest-page">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <ToastContainer position="top-right" autoClose={2000} transition={Slide} />

      <div className="main-card">
        <div className="card-header">
          <div>
            <h1 className="page-title">✨ Tạo Cuộc thi mới</h1>
            <p className="page-subtitle">Thiết lập kỳ thi mới và chọn bộ đề bài phù hợp.</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => router.push("/creator/contests")}>
            📋 Quản lý cuộc thi
          </button>
        </div>

        <form onSubmit={onSubmit} className="contest-form">
          
          <div className="form-column left-col">
            <h3 className="section-heading">📝 Thông tin cuộc thi</h3>
            
            <div className="form-group">
              <label className="label">Tên cuộc thi <span className="required">*</span></label>
              <input className="input-field" value={TenCuocThi} onChange={(e) => setTenCuocThi(e.target.value)} placeholder="VD: Kỳ thi Olympic Tin học 2025" required />
            </div>

            <div className="form-group">
              <label className="label">Mô tả cuộc thi (Markdown)</label>
              <div className="markdown-box">
                <textarea 
                  className="textarea-field" 
                  value={MoTa} 
                  onChange={(e) => setMoTa(e.target.value)} 
                  placeholder="Giới thiệu về cuộc thi..." 
                  required 
                />
                {MoTa && (
                  <div className="preview-area markdown-body">
                    <span className="badge">Xem trước mô tả</span>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                    >
                      {MoTa}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Quy định & Lưu ý</label>
              <div className="markdown-box">
                <textarea 
                  className="textarea-field warning-border" 
                  value={ChuY} 
                  onChange={(e) => setChuY(e.target.value)} 
                  placeholder="VD: Không dùng tài liệu..." 
                />
                {ChuY && (
                  <div className="preview-area warning-preview markdown-body">
                    <span className="badge warning">Xem trước lưu ý</span>
                    <ReactMarkdown 
                       remarkPlugins={[remarkGfm, remarkMath]}
                       rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                    >
                      {ChuY}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="row-2-cols">
              <div className="form-group">
                <label className="label">Bắt đầu <span className="required">*</span></label>
                <input type="datetime-local" className="input-field" value={ThoiGianBatDau} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="label">Kết thúc <span className="required">*</span></label>
                <input type="datetime-local" className="input-field" value={ThoiGianKetThuc} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="form-column right-col">
            <h3 className="section-heading">📚 Cấu trúc đề thi ({selectedProblems.length} bài)</h3>
            
            <div className="problems-container">
              
              <div className="selected-list">
                <h4 className="sub-heading blue-text">Đã chọn cho cuộc thi</h4>
                {selectedProblems.length === 0 ? (
                  <div className="empty-state">Chưa có bài nào được chọn.</div>
                ) : (
                  <div className="problem-items">
                    {selectedProblems.map((p, index) => (
                      <div key={p.IdDeBai} className="problem-card selected">
                        <div className="card-top">
                          <span className="problem-tag">Bài {String.fromCharCode(65 + index)}</span>
                          <button type="button" className="btn-remove" onClick={() => handleRemoveProblem(p.IdDeBai)}>✕</button>
                        </div>
                        <div className="card-body">
                          <div className="original-label">Gốc: {p.OriginalTitle}</div>
                          <input 
                            className="input-display-name" 
                            value={p.TenHienThi} 
                            onChange={(e) => handleUpdateDisplayTitle(p.IdDeBai, e.target.value)}
                            placeholder="Tên bài hiển thị"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="available-list">
                <h4 className="sub-heading green-text">Kho bài tập khả dụng ({filteredAvailableProblems.length})</h4>
                <div className="problem-items scrollable">
                  {filteredAvailableProblems.length === 0 ? (
                    <div className="empty-state sm">Kho bài tập trống.</div>
                  ) : (
                    filteredAvailableProblems.map((p) => (
                      <div key={p.IdDeBai} className="problem-card available" onClick={() => handleAddProblem(p)}>
                        <div className="problem-info">
                          <span className="id-tag">#{p.IdDeBai}</span>
                          <span className="title-text">{p.TieuDe}</span>
                        </div>
                        <span className="add-icon">+</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="form-footer">
             <button type="submit" className="btn-primary" disabled={saving}>
               {saving ? "⏳ Đang tạo..." : "🚀 Hoàn tất & Tạo cuộc thi"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const pageStyles = `
  .create-contest-page { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Inter', system-ui, sans-serif; color: #374151; }
  .main-card { background: white; border-radius: 20px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }
  
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 30px 40px; border-bottom: 1px solid #f3f4f6; }
  .page-title { font-size: 26px; font-weight: 800; color: #111827; margin: 0; }
  .page-subtitle { color: #6b7280; margin-top: 4px; font-size: 15px; }

  .contest-form { display: grid; grid-template-columns: 1fr 420px; }
  .form-column { padding: 40px; }
  .left-col { border-right: 1px solid #f3f4f6; }
  .right-col { background-color: #f8fafc; }
  .form-footer { grid-column: 1 / -1; padding: 30px 40px; border-top: 1px solid #e5e7eb; background: white; text-align: center; }

  .section-heading { font-size: 19px; font-weight: 700; color: #111827; margin-bottom: 24px; border-left: 5px solid #2563eb; padding-left: 15px; }
  .form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
  .required { color: #ef4444; }
  
  .input-field { padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; outline: none; transition: 0.2s; background: white; }
  .input-field:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
  .row-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .markdown-box { display: flex; flex-direction: column; gap: 10px; }
  .textarea-field { 
    padding: 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; 
    outline: none; transition: 0.2s; resize: vertical; min-height: 120px; font-family: inherit; 
  }
  .textarea-field:focus { border-color: #2563eb; }

  .preview-area { 
    background-color: white; border: 1px solid #e5e7eb; border-radius: 10px; 
    padding: 20px; font-size: 15px; line-height: 1.7; position: relative; 
    min-height: 100px; max-height: 400px; overflow-y: auto; 
  }
  .warning-preview { background-color: #fffbeb; border-color: #fef3c7; }
  .badge { position: absolute; top: 0; right: 0; background: #f1f5f9; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-bottom-left-radius: 10px; }
  .badge.warning { background: #fef3c7; color: #b45309; }

  /* GitHub Flavored Markdown Styling */
  .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-bottom: 16px; margin-top: 24px; font-weight: 600; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin-bottom: 16px; border: 1px solid #dfe2e5; }
  .markdown-body table th, .markdown-body table td { border: 1px solid #dfe2e5; padding: 8px 12px; }
  .markdown-body table tr:nth-child(2n) { background: #f6f8fa; }
  .markdown-body code { background: rgba(27,31,35,0.05); padding: 2px 4px; border-radius: 3px; font-family: monospace; color: #e83e8c; }
  .markdown-body pre { background: #f6f8fa; padding: 16px; border-radius: 8px; overflow: auto; border: 1px solid #e1e4e8; }

  .sub-heading { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 15px; }
  .blue-text { color: #2563eb; }
  .green-text { color: #059669; }

  .problem-items { display: flex; flex-direction: column; gap: 12px; }
  .scrollable { max-height: 500px; overflow-y: auto; padding-right: 8px; }

  .problem-card.selected { background: white; border: 1px solid #dbeafe; border-left: 5px solid #2563eb; border-radius: 12px; padding: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .problem-tag { font-weight: 900; color: #1e40af; font-size: 12px; background: #eff6ff; padding: 4px 10px; border-radius: 6px; }
  .btn-remove { background: #fee2e2; border: none; color: #ef4444; font-weight: bold; cursor: pointer; font-size: 14px; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .original-label { font-size: 11px; color: #9ca3af; margin-bottom: 6px; font-style: italic; }
  .input-display-name { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; outline: none; }

  .problem-card.available { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
  .problem-card.available:hover { border-color: #10b981; transform: translateX(4px); }
  .id-tag { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; color: #64748b; font-weight: 600; }
  .title-text { font-size: 14px; font-weight: 600; }

  .empty-state { text-align: center; color: #9ca3af; font-size: 14px; padding: 30px; border: 2px dashed #e2e8f0; border-radius: 12px; font-style: italic; }
  
  .btn-primary { width: 100%; max-width: 400px; padding: 16px; background: #2563eb; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(37,99,235,0.3); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); }

  .loading-state { text-align: center; padding: 120px; color: #64748b; font-weight: 600; }
  .access-denied { text-align: center; padding: 100px; }
`;