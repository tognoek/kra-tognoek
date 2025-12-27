"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface UserInfo {
  IdTaiKhoan: string;
  VaiTro: string;
}

interface Topic {
  IdChuDe: number;
  TenChuDe: string;
}

export default function CreateProblemPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // --- FORM STATES ---
  const [TieuDe, setTieuDe] = useState("");
  const [NoiDungDeBai, setNoiDungDeBai] = useState("");
  
  const [DoKho, setDoKho] = useState("1"); 
  const [DangCongKhai, setPublic] = useState(true);
  
  const [GioiHanThoiGian, setTimeLimit] = useState(1000);
  const [GioiHanBoNho, setMemoryLimit] = useState(256);
  
  const [testFile, setTestFile] = useState<File | null>(null);
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [checkerPath, setCheckerPath] = useState(""); // Đã thêm lại state này

  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("oj_user");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch (e) { console.error(e); }
      }
    }

    fetch(`${API_BASE}/api/topics`)
      .then(res => res.ok ? res.json() : [])
      .then(setAvailableTopics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isCreator = user?.VaiTro?.toLowerCase() === "creator" || user?.VaiTro?.toLowerCase() === "admin";

  const handleTopicChange = (topicId: number) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isCreator) return;
    setSaving(true);
    setError(null);

    try {
      if (!TieuDe.trim()) throw new Error("Tiêu đề không được để trống");
      if (!NoiDungDeBai.trim()) throw new Error("Nội dung đề bài không được để trống");
      if (selectedTopics.length === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        throw new Error("Vui lòng chọn ít nhất 1 chủ đề.");
      }

      const res = await fetch(`${API_BASE}/api/problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: Number(user.IdTaiKhoan),
          TieuDe,
          NoiDungDeBai,
          DoKho: DoKho,
          GioiHanThoiGian,
          GioiHanBoNho,
          DangCongKhai,
          topicIds: selectedTopics,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi tạo bài tập");

      if (testFile) {
        const base64 = await fileToBase64(testFile);
        const upRes = await fetch(`${API_BASE}/api/upload/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64,
            originalName: testFile.name,
            problemId: data.IdDeBai,
            inputPath: inputPath || null,
            outputPath: outputPath || null,
            checkerPath: checkerPath || null, // Gửi custom checker lên
          }),
        });
        if (!upRes.ok) throw new Error("Bài tập đã tạo nhưng lỗi upload file test.");
      }

      router.push("/creator/problems");

    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">Đang tải...</div>;
  if (!isCreator) return <div className="access-denied"><h3>Bạn không có quyền truy cập trang này.</h3></div>;

  return (
    <div className="create-page-container">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <div className="main-card">
        {/* HEADER */}
        <div className="card-header">
          <h1 className="page-title">Tạo đề bài mới</h1>
          <button type="button" className="btn-secondary" onClick={() => router.push("/creator/problems")}>
            📋 Quản lý bài tập
          </button>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <form onSubmit={onSubmit} className="form-grid">
          
          {/* Section: Thông tin chung */}
          <div className="form-section full-width">
            <h3 className="section-heading">📝 Thông tin chung</h3>
            
            <div className="form-group">
              <label className="label">Tiêu đề bài tập <span className="required">*</span></label>
              <input className="input-field" value={TieuDe} onChange={e => setTieuDe(e.target.value)} placeholder="Ví dụ: Tính tổng hai số nguyên lớn" required />
            </div>

            <div className="row-2-cols">
              <div className="form-group">
                <label className="label">Độ khó</label>
                <select className="select-field" value={DoKho} onChange={e => setDoKho(e.target.value)}>
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} - {i+1 <= 3 ? "Dễ" : i+1 <= 7 ? "Trung bình" : "Khó"}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Chế độ hiển thị</label>
                <select className="select-field" value={String(DangCongKhai)} onChange={e => setPublic(e.target.value === "true")}>
                  <option value="true">🌎 Công khai</option>
                  <option value="false">🔒 Riêng tư</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Chủ đề (Tags) <span className="required">*</span></label>
              <div className="tags-container">
                {availableTopics.map(topic => (
                  <label key={topic.IdChuDe} className={`tag-item ${selectedTopics.includes(topic.IdChuDe) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selectedTopics.includes(topic.IdChuDe)} onChange={() => handleTopicChange(topic.IdChuDe)} hidden />
                    {topic.TenChuDe}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Nội dung đề bài */}
          <div className="form-section full-width">
            <h3 className="section-heading">📄 Nội dung đề bài</h3>
            <div className="markdown-editor">
              <div className="editor-col">
                <label className="sub-label">Soạn thảo (Markdown)</label>
                <textarea 
                  className="textarea-field" 
                  value={NoiDungDeBai} 
                  onChange={e => setNoiDungDeBai(e.target.value)} 
                  placeholder="Nhập nội dung đề bài tại đây..."
                />
              </div>
              <div className="preview-col">
                <label className="sub-label">Xem trước</label>
                <div className="markdown-preview">
                  {NoiDungDeBai ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{NoiDungDeBai}</ReactMarkdown> : <em className="placeholder-text">Nội dung sẽ hiển thị ở đây...</em>}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Cấu hình kỹ thuật */}
          <div className="form-section full-width">
            <h3 className="section-heading">⚙️ Cấu hình Kỹ thuật & Test</h3>
            
            <div className="row-3-cols">
              <div className="form-group">
                <label className="label">Thời gian (ms)</label>
                <input type="number" className="input-field" value={GioiHanThoiGian} onChange={e => setTimeLimit(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="label">Bộ nhớ (MB)</label>
                <input type="number" className="input-field" value={GioiHanBoNho} onChange={e => setMemoryLimit(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="label">File Test (.zip)</label>
                <div className="file-input-wrapper">
                  <input type="file" accept=".zip" onChange={e => setTestFile(e.target.files?.[0] || null)} />
                </div>
                <p className="help-text">Cấu trúc: test01/test01.inp...</p>
              </div>
            </div>

            <div className="row-3-cols" style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label className="label">File Input</label>
                <input className="input-field" value={inputPath} onChange={e => setInputPath(e.target.value)} placeholder="VD: bai1.inp (Trống=stdin)" />
              </div>
              <div className="form-group">
                <label className="label">File Output</label>
                <input className="input-field" value={outputPath} onChange={e => setOutputPath(e.target.value)} placeholder="VD: bai1.out (Trống=stdout)" />
              </div>
              <div className="form-group">
                <label className="label">Custom Checker</label>
                <input className="input-field" value={checkerPath} onChange={e => setCheckerPath(e.target.value)} placeholder="VD: check.cpp" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions full-width">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Đang xử lý..." : "✅ Hoàn tất & Tạo bài tập"}
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
  /* Global Layout */
  .create-page-container {
    max-width: 1000px;
    margin: 40px auto;
    padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #374151;
  }

  .main-card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    padding: 32px;
  }

  /* Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f3f4f6;
  }

  .page-title {
    font-size: 26px;
    font-weight: 800;
    color: #111827;
    margin: 0;
  }

  /* Buttons */
  .btn-secondary {
    padding: 10px 18px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    color: #4b5563;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

  .btn-primary {
    width: 100%;
    padding: 14px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
  }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; transform: none; }

  /* Form Layout */
  .form-grid { display: grid; gap: 30px; }
  .full-width { grid-column: 1 / -1; }
  .row-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .row-3-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

  /* Sections */
  .section-heading {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Inputs & Labels */
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .label { font-size: 14px; font-weight: 600; color: #4b5563; }
  .sub-label { font-size: 13px; font-weight: 600; color: #6b7280; margin-bottom: 8px; display: block; }
  .required { color: #dc2626; }
  .help-text { font-size: 12px; color: #9ca3af; margin: 4px 0 0; }

  .input-field, .select-field {
    padding: 10px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border 0.2s, box-shadow 0.2s;
  }
  .input-field:focus, .select-field:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Tags */
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
  .tag-item {
    font-size: 13px;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #d1d5db;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .tag-item:hover { border-color: #9ca3af; }
  .tag-item.selected {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
    font-weight: 600;
  }

  /* Markdown Editor */
  .markdown-editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    height: 450px;
  }
  .editor-col, .preview-col { display: flex; flex-direction: column; height: 100%; }
  
  .textarea-field {
    flex: 1;
    padding: 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-family: monospace;
    font-size: 14px;
    resize: none;
    outline: none;
  }
  .textarea-field:focus { border-color: #3b82f6; }

  .markdown-preview {
    flex: 1;
    padding: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
  }
  .placeholder-text { color: #9ca3af; }

  /* File Input */
  .file-input-wrapper {
    position: relative;
    overflow: hidden;
  }
  .file-input-wrapper input[type=file] {
    font-size: 13px;
    width: 100%;
  }

  /* Utilities */
  .error-banner {
    background: #fef2f2;
    color: #991b1b;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #fecaca;
    margin-bottom: 20px;
    font-size: 14px;
  }
  .loading-state { text-align: center; margin-top: 100px; color: #6b7280; }
  .access-denied { text-align: center; margin-top: 50px; }

  /* Responsive */
  @media (max-width: 768px) {
    .row-2-cols, .row-3-cols, .markdown-editor { grid-template-columns: 1fr; }
    .markdown-editor { height: auto; }
    .textarea-field { min-height: 200px; }
    .markdown-preview { min-height: 200px; }
  }
`;