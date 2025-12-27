"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown"; // Đã thêm
import remarkGfm from "remark-gfm";         // Đã thêm

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

  // 1. Load User & Bài tập
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("oj_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        fetchAvailableProblems(parsed.IdTaiKhoan);
      } catch (e) {
        console.error("Parse user failed", e);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const fetchAvailableProblems = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/problems/available?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableProblems(data);
      }
    } catch (e) { console.error(e); }
  };

  const isAdmin = user?.VaiTro?.toLowerCase() === "admin";
  const isCreator = user?.VaiTro?.toLowerCase() === "creator" || isAdmin;

  // 2. Logic thêm/xóa bài
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

  // 3. Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isCreator) return;

    if (selectedProblems.length === 0) {
      setError("Vui lòng chọn ít nhất 1 đề bài cho cuộc thi.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const problemsPayload = selectedProblems.map((p) => ({
        IdDeBai: p.IdDeBai,
        TenHienThi: p.TenHienThi || p.OriginalTitle,
      }));

      const res = await fetch(`${API_BASE}/api/contests`, {
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
      
      router.push("/creator/contests");
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailableProblems = availableProblems.filter(
    (p) => !selectedProblems.some((sp) => String(sp.IdDeBai) === String(p.IdDeBai))
  );

  if (loading) return <div className="loading-state">Đang tải dữ liệu...</div>;
  if (!isCreator) return <div className="access-denied"><h3>Bạn không có quyền truy cập trang này.</h3></div>;

  return (
    <div className="create-contest-page">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <div className="main-card">
        <div className="card-header">
          <h1 className="page-title">Tạo Cuộc thi mới</h1>
          <button type="button" className="btn-secondary" onClick={() => router.push("/creator/contests")}>
            Quản lý cuộc thi
          </button>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={onSubmit} className="contest-form">
          
          {/* LEFT COLUMN: Cấu hình chung */}
          <div className="form-column left-col">
            <h3 className="section-heading">🛠 Cấu hình cuộc thi</h3>
            
            <div className="form-group">
              <label className="label">Tên cuộc thi <span className="required">*</span></label>
              <input className="input-field" value={TenCuocThi} onChange={(e) => setTenCuocThi(e.target.value)} placeholder="VD: Kỳ thi Lập trình Hè 2024" required />
            </div>

            {/* MÔ TẢ CÓ PREVIEW */}
            <div className="form-group">
              <label className="label">Mô tả ngắn (Markdown)</label>
              <div className="markdown-container">
                <textarea 
                  className="textarea-field" 
                  value={MoTa} 
                  onChange={(e) => setMoTa(e.target.value)} 
                  rows={4} 
                  placeholder="Nhập mô tả..." 
                  required 
                />
                {MoTa && (
                  <div className="markdown-preview">
                    <span className="preview-badge">Xem trước</span>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{MoTa}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* CHÚ Ý CÓ PREVIEW */}
            <div className="form-group">
              <label className="label">Ghi chú (Lưu ý cho thí sinh)</label>
              <div className="markdown-container">
                <textarea 
                  className="textarea-field" 
                  value={ChuY} 
                  onChange={(e) => setChuY(e.target.value)} 
                  rows={3} 
                  placeholder="VD: Không dùng thư viện ngoài..." 
                />
                {ChuY && (
                  <div className="markdown-preview warning-preview">
                    <span className="preview-badge">Xem trước</span>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{ChuY}</ReactMarkdown>
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

          {/* RIGHT COLUMN: Chọn đề thi */}
          <div className="form-column right-col">
            <h3 className="section-heading">📚 Đề thi ({selectedProblems.length})</h3>
            
            <div className="problems-container">
              
              <div className="selected-list">
                <h4 className="sub-heading selected">Đã chọn cho Contest</h4>
                {selectedProblems.length === 0 ? (
                  <div className="empty-state">Chưa chọn bài nào.<br/>Hãy chọn từ danh sách bên dưới.</div>
                ) : (
                  <div className="problem-items">
                    {selectedProblems.map((p, index) => (
                      <div key={p.IdDeBai} className="problem-card selected">
                        <div className="card-top">
                          <span className="problem-index">Bài {String.fromCharCode(65 + index)}</span>
                          <button type="button" className="btn-remove" onClick={() => handleRemoveProblem(p.IdDeBai)}>✕</button>
                        </div>
                        <div className="card-body">
                          <div className="original-title">Gốc: {p.OriginalTitle}</div>
                          <input 
                            className="input-display-name" 
                            value={p.TenHienThi} 
                            onChange={(e) => handleUpdateDisplayTitle(p.IdDeBai, e.target.value)}
                            placeholder="Tên hiển thị trong contest"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="available-list">
                <h4 className="sub-heading available">Kho bài tập của tôi ({filteredAvailableProblems.length})</h4>
                <div className="problem-items scrollable">
                  {filteredAvailableProblems.length === 0 ? (
                    <div className="empty-state sm">Hết bài tập khả dụng.</div>
                  ) : (
                    filteredAvailableProblems.map((p) => (
                      <div key={p.IdDeBai} className="problem-card available" onClick={() => handleAddProblem(p)}>
                        <div className="problem-info">
                          <span className="problem-id">#{p.IdDeBai}</span>
                          <span className="problem-title">{p.TieuDe}</span>
                        </div>
                        <span className="btn-add">+</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Footer Action */}
          <div className="form-footer">
             <button type="submit" className="btn-primary" disabled={saving}>
               {saving ? "Đang khởi tạo..." : "🚀 Hoàn tất & Tạo cuộc thi"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ========================================================
// MODERN CSS STYLES
// ========================================================
const pageStyles = `
  /* Global */
  .create-contest-page {
    max-width: 1200px; margin: 40px auto; padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #374151;
  }
  .main-card { background: white; border-radius: 16px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }
  
  /* Header */
  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; border-bottom: 1px solid #f3f4f6; }
  .page-title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
  
  /* Buttons */
  .btn-secondary { padding: 8px 16px; background: white; border: 1px solid #d1d5db; border-radius: 8px; font-weight: 600; cursor: pointer; color: #4b5563; transition: 0.2s; }
  .btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

  .btn-primary { width: 100%; padding: 14px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }

  /* Form Layout */
  .contest-form { display: grid; grid-template-columns: 1fr 1fr; }
  .form-column { padding: 32px; }
  .left-col { border-right: 1px solid #f3f4f6; }
  .right-col { background-color: #f9fafb; }
  .form-footer { grid-column: 1 / -1; padding: 24px 32px; border-top: 1px solid #e5e7eb; background: white; }

  /* Inputs & Markdown */
  .section-heading { font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
  .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
  .label { font-size: 14px; font-weight: 600; color: #4b5563; }
  .required { color: #dc2626; }
  .input-field { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; }
  .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .row-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Markdown Specific */
  .markdown-container { display: flex; flex-direction: column; gap: 8px; }
  .textarea-field { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; width: 100%; box-sizing: border-box; font-family: inherit; }
  .textarea-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  
  .markdown-preview {
    background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;
    font-size: 14px; line-height: 1.6; position: relative; max-height: 200px; overflow-y: auto;
  }
  .markdown-preview.warning-preview { background-color: #fff7ed; border-color: #fed7aa; color: #9a3412; }
  .preview-badge {
    position: absolute; top: 0; right: 0; background: #e5e7eb; color: #6b7280;
    font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px;
    border-bottom-left-radius: 8px;
  }

  /* Problem Selection Area */
  .problems-container { display: flex; flex-direction: column; gap: 24px; height: 100%; }
  .sub-heading { font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .sub-heading.selected { color: #2563eb; }
  .sub-heading.available { color: #059669; margin-top: 10px; }

  .problem-items { display: flex; flex-direction: column; gap: 10px; }
  .scrollable { max-height: 350px; overflow-y: auto; padding-right: 5px; }

  /* Problem Card: Selected */
  .problem-card.selected { background: white; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .problem-index { font-weight: 800; color: #1e40af; font-size: 13px; background: #dbeafe; padding: 2px 8px; border-radius: 4px; }
  .btn-remove { background: none; border: none; color: #ef4444; font-weight: bold; cursor: pointer; font-size: 16px; padding: 0 4px; }
  .btn-remove:hover { color: #b91c1c; background: #fee2e2; border-radius: 4px; }
  .original-title { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
  .input-display-name { width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }

  /* Problem Card: Available */
  .problem-card.available { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
  .problem-card.available:hover { border-color: #059669; transform: translateX(2px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .problem-info { display: flex; align-items: center; gap: 10px; }
  .problem-id { font-family: monospace; font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #666; }
  .problem-title { font-size: 14px; font-weight: 500; color: #374151; }
  .btn-add { font-weight: bold; color: #059669; font-size: 18px; }

  /* Utilities */
  .empty-state { text-align: center; color: #9ca3af; font-size: 14px; padding: 20px; border: 2px dashed #e5e7eb; border-radius: 8px; }
  .empty-state.sm { padding: 10px; font-size: 13px; }
  .error-banner { background: #fef2f2; color: #991b1b; padding: 12px 32px; border-bottom: 1px solid #fecaca; }
  .loading-state, .access-denied { text-align: center; margin-top: 100px; color: #666; }

  /* Responsive */
  @media (max-width: 900px) {
    .contest-form { grid-template-columns: 1fr; }
    .left-col { border-right: none; border-bottom: 1px solid #f3f4f6; }
    .scrollable { max-height: 300px; }
  }
`;