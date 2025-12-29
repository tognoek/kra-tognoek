"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [TieuDe, setTieuDe] = useState("");
  const [NoiDung, setNoiDung] = useState("");
  const [UuTien, setUuTien] = useState(1);
  const [TrangThai, setTrangThai] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.VaiTro?.toLowerCase() === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      const saved = window.localStorage.getItem("oj_user");
      const parsedUser = saved ? JSON.parse(saved) : null;
      setUser(parsedUser);

      try {
        const res = await fetch(`${API_BASE}/api/posts/manage?userId=${parsedUser?.IdTaiKhoan}&role=${parsedUser?.VaiTro}`);
        const data = await res.json();
        const post = data.find((p: any) => p.IdBaiDang === postId);
        
        if (post) {
          setTieuDe(post.TieuDe);
          setNoiDung(post.NoiDung);
          setUuTien(post.UuTien);
          setTrangThai(post.TrangThai);
        }
      } catch (e) { 
        toast.error("Không thể tải dữ liệu bài viết"); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [postId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Đang cập nhật bài viết...");

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          TieuDe, 
          NoiDung, 
          ...(isAdmin && { UuTien }), 
          TrangThai, 
          role: user?.VaiTro?.toLowerCase() 
        }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");
      toast.update(toastId, { render: "Đã cập nhật bài đăng thành công!", type: "success", isLoading: false, autoClose: 1500 });
      setTimeout(() => router.push("/creator/posts"), 1500);
    } catch (err: any) {
      toast.update(toastId, { render: err.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-state">⌛ Đang tải dữ liệu bài viết...</div>;

  return (
    <div className="edit-page-wrapper">
      <ToastContainer position="top-right" autoClose={2000} transition={Slide} />
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      
      <div className="main-card">
        <div className="card-header">
          <div>
             <h1 className="page-title">⚙️ Chỉnh sửa bài đăng #{postId}</h1>
             <p className="page-subtitle">Cập nhật nội dung Markdown và trạng thái hiển thị.</p>
          </div>
          <button className="btn btn-outline" onClick={() => router.back()}>← Quay lại</button>
        </div>

        <form onSubmit={onSubmit} className="form-content">
          <div className="row-3-cols">
             <div className="form-group flex-grow">
                <label className="label">Tiêu đề bài đăng</label>
                <input className="input" value={TieuDe} onChange={e => setTieuDe(e.target.value)} required />
             </div>
             <div className="form-group">
                <label className="label">Trạng thái</label>
                <select className="select" value={String(TrangThai)} onChange={e => setTrangThai(e.target.value === "true")}>
                   <option value="true">✅ Công khai</option>
                   <option value="false">🔒 Đang ẩn</option>
                </select>
             </div>
             <div className="form-group">
                <label className="label">Độ ưu tiên</label>
                {isAdmin ? (
                  <input 
                    type="number" min="1" max="10" className="input" 
                    value={UuTien} 
                    onChange={e => setUuTien(Number(e.target.value))}
                  />
                ) : (
                  <div className="readonly-priority">Cấp độ {UuTien}</div>
                )}
             </div>
          </div>

          <div className="editor-layout">
            <div className="editor-col">
              <label className="sub-label">Biên soạn (Markdown)</label>
              <textarea 
                className="textarea code-font" 
                value={NoiDung} 
                onChange={e => setNoiDung(e.target.value)} 
                placeholder="Nhập nội dung bài đăng tại đây..."
                required 
              />
            </div>
            <div className="preview-col">
              <label className="sub-label">Xem trước kết quả</label>
              <div className="markdown-view markdown-body">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                >
                  {NoiDung || "*Chưa có nội dung bài đăng...*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "⏳ Đang lưu bài viết..." : "💾 Cập nhật bài viết"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const pageStyles = `
  .edit-page-wrapper { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Inter', system-ui, sans-serif; color: #374151; }
  .main-card { background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
  .card-header { padding: 30px 40px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
  .page-title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
  .page-subtitle { color: #6b7280; margin-top: 6px; font-size: 15px; }

  .form-content { padding: 40px; display: flex; flex-direction: column; gap: 32px; }
  .row-3-cols { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 24px; }

  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
  .sub-label { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  
  .input, .select { padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; transition: 0.2s; background: white; outline: none; }
  .input:focus, .select:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
  
  .readonly-priority { padding: 12px 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #6b7280; font-weight: 700; cursor: not-allowed; }

  .editor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; min-height: 500px; height: auto; }
  .editor-col, .preview-col { display: flex; flex-direction: column; }
  
  .textarea { flex: 1; min-height: 500px; padding: 20px; border: 1px solid #d1d5db; border-radius: 12px; resize: vertical; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.7; background: #f8fafc; outline: none; }
  .textarea:focus { border-color: #2563eb; background: white; }

  .markdown-view { flex: 1; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; overflow-y: auto; min-height: 500px; }

  /* Markdown Body Content Synchronization */
  .markdown-body { font-size: 15px; line-height: 1.8; color: #24292e; }
  .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.4em; margin-top: 1.2em; margin-bottom: 0.8em; font-weight: 700; }
  .markdown-body p { margin-bottom: 16px; }
  .markdown-body code { background: rgba(27,31,35,0.05); padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 90%; color: #e83e8c; }
  .markdown-body pre { background: #f6f8fa; padding: 16px; border-radius: 10px; overflow: auto; border: 1px solid #e1e4e8; margin-bottom: 16px; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #dfe2e5; }
  .markdown-body table th, .markdown-body table td { border: 1px solid #dfe2e5; padding: 8px 12px; }
  .markdown-body table tr:nth-child(2n) { background: #f6f8fa; }

  .form-footer { border-top: 1px solid #f3f4f6; padding-top: 30px; }
  .btn { padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; font-size: 14px; }
  .btn-outline { background: white; border: 1px solid #d1d5db; color: #4b5563; }
  .btn-outline:hover { background: #f9fafb; border-color: #9ca3af; }
  .btn-primary { background: #2563eb; color: white; width: 100%; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }

  .loading-state { text-align: center; padding: 120px; font-size: 18px; color: #64748b; }
`;