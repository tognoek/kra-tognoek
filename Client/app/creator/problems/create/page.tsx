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
  const [checkerPath, setCheckerPath] = useState(""); 
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
    const toastId = toast.loading("Đang tạo bài tập...");

    try {
      if (!TieuDe.trim()) throw new Error("Tiêu đề không được để trống");
      if (!NoiDungDeBai.trim()) throw new Error("Nội dung đề bài không được để trống");
      if (selectedTopics.length === 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        throw new Error("Vui lòng chọn ít nhất 1 chủ đề.");
      }

      const res = await fetch(`${API_BASE}/api/creator_problem`, {
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
            checkerPath: checkerPath || null,
          }),
        });
        if (!upRes.ok) throw new Error("Bài tập đã tạo nhưng lỗi upload file test.");
      }

      toast.update(toastId, { render: "Tạo bài tập thành công!", type: "success", isLoading: false, autoClose: 1500 });
      setTimeout(() => router.push("/creator/problems"), 1500);

    } catch (err: any) {
      setError(err.message);
      toast.update(toastId, { render: err.message || "Đã xảy ra lỗi", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">⌛ Đang tải hệ thống...</div>;
  if (!isCreator) return <div className="access-denied"><h3>Bạn không có quyền truy cập trang này.</h3></div>;

  return (
    <div className="create-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <ToastContainer position="top-right" autoClose={2000} transition={Slide} />

      <div className="main-card">
        {/* HEADER */}
        <div className="card-header">
          <div>
            <h1 className="page-title">✨ Tạo đề bài mới</h1>
            <p className="page-subtitle">Thiết kế bài toán mới cho hệ thống Online Judge.</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => router.push("/creator/problems")}>
             📋 Danh sách bài tập
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-content">
          
          {/* Section: Thông tin chung */}
          <div className="form-section">
            <h3 className="section-title">📝 Thông tin cơ bản</h3>
            
            <div className="form-group full-width">
              <label className="label">Tiêu đề bài tập <span className="required">*</span></label>
              <input className="input" value={TieuDe} onChange={e => setTieuDe(e.target.value)} placeholder="Ví dụ: Tính tổng A + B" required />
            </div>

            <div className="row-3-cols">
              <div className="form-group">
                <label className="label">Độ khó</label>
                <select className="select" value={DoKho} onChange={e => setDoKho(e.target.value)}>
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} - {i+1 <= 3 ? "Dễ" : i+1 <= 7 ? "T.Bình" : "Khó"}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Hiển thị</label>
                <select className="select" value={String(DangCongKhai)} onChange={e => setPublic(e.target.value === "true")}>
                  <option value="true">🌎 Công khai</option>
                  <option value="false">🔒 Riêng tư</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Phân loại</label>
                <div className="select disabled-look">Tạo mới</div>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="label">Chủ đề (Tags) <span className="required">*</span></label>
              <div className="tags-wrapper">
                {availableTopics.map(topic => (
                  <label key={topic.IdChuDe} className={`tag-pill ${selectedTopics.includes(topic.IdChuDe) ? 'active' : ''}`}>
                    <input type="checkbox" checked={selectedTopics.includes(topic.IdChuDe)} onChange={() => handleTopicChange(topic.IdChuDe)} hidden />
                    {topic.TenChuDe}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Nội dung đề bài - AUTO HEIGHT FIX */}
          <div className="form-section">
            <h3 className="section-title">📄 Nội dung đề bài</h3>
            <div className="editor-layout">
              <div className="editor-col">
                <label className="sub-label">Soạn thảo (Markdown)</label>
                <textarea 
                  className="textarea code-font" 
                  value={NoiDungDeBai} 
                  onChange={e => setNoiDungDeBai(e.target.value)} 
                  placeholder="Hỗ trợ Markdown và KaTeX..."
                  required
                />
              </div>
              <div className="preview-col">
                <label className="sub-label">Xem trước kết quả</label>
                <div className="markdown-view markdown-body">
                  {NoiDungDeBai ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                    >
                      {NoiDungDeBai}
                    </ReactMarkdown>
                  ) : (
                    <em style={{color: '#9ca3af'}}>Nội dung đề bài sẽ hiển thị tại đây...</em>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Cấu hình kỹ thuật */}
          <div className="form-section">
            <h3 className="section-title">⚙️ Cấu hình Kỹ thuật & Test Data</h3>
            
            <div className="row-2-cols">
              <div className="form-group">
                <label className="label">Giới hạn thời gian (ms)</label>
                <input type="number" className="input" value={GioiHanThoiGian} onChange={e => setTimeLimit(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="label">Giới hạn bộ nhớ (KB)</label>
                <input type="number" className="input" value={GioiHanBoNho} onChange={e => setMemoryLimit(Number(e.target.value))} />
              </div>
            </div>

            <div className="test-config-box">
              <div className="test-header">
                <h4>⚠️ Dữ liệu chấm bài</h4>
                <p>Nén các file test thành .zip (Ví dụ: test01.inp, test01.out...)</p>
              </div>
              
              <div className="row-3-cols">
                <div className="form-group">
                  <label className="label">Tên File Input</label>
                  <input className="input" value={inputPath} onChange={e => setInputPath(e.target.value)} placeholder="bai.inp" />
                </div>
                <div className="form-group">
                  <label className="label">Tên File Output</label>
                  <input className="input" value={outputPath} onChange={e => setOutputPath(e.target.value)} placeholder="bai.out" />
                </div>
                <div className="form-group">
                  <label className="label">File Checker</label>
                  <input className="input" value={checkerPath} onChange={e => setCheckerPath(e.target.value)} placeholder="check.cpp" />
                </div>
              </div>

              <div className="form-group full-width" style={{marginTop: '20px'}}>
                <label className="label">Tải lên file nén (.zip)</label>
                <input type="file" accept=".zip" className="file-input" onChange={e => setTestFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "⏳ Đang xử lý..." : "🚀 Tạo bài tập ngay"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

const pageStyles = `
  .create-page-wrapper { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Inter', system-ui, sans-serif; color: #374151; }
  .main-card { background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
  .card-header { padding: 30px 40px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
  .page-title { font-size: 26px; font-weight: 800; color: #111827; margin: 0; }
  .page-subtitle { color: #6b7280; margin-top: 6px; font-size: 15px; }

  .form-content { padding: 40px; display: flex; flex-direction: column; gap: 48px; }
  .form-section { display: flex; flex-direction: column; gap: 24px; }
  .section-title { font-size: 20px; font-weight: 700; color: #111827; border-left: 5px solid #2563eb; padding-left: 15px; margin: 0; }
  
  .row-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .row-3-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
  .full-width { grid-column: 1 / -1; }

  .form-group { display: flex; flex-direction: column; gap: 10px; }
  .label { font-size: 13px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
  .required { color: #ef4444; }
  .sub-label { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  
  .input, .select { padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; transition: 0.2s; background: white; outline: none; }
  .input:focus, .select:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
  .disabled-look { background: #f3f4f6; color: #9ca3af; border-style: dashed; }

  .tags-wrapper { display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
  .tag-pill { font-size: 13px; padding: 8px 18px; border-radius: 30px; border: 1px solid #d1d5db; background: white; cursor: pointer; transition: 0.2s; font-weight: 500; }
  .tag-pill:hover { border-color: #2563eb; color: #2563eb; }
  .tag-pill.active { background: #2563eb; border-color: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2); }

  /* EDITOR LAYOUT AUTO HEIGHT */
  .editor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; min-height: 450px; height: auto; align-items: stretch; }
  .editor-col, .preview-col { display: flex; flex-direction: column; gap: 12px; }
  
  .textarea { 
    flex: 1; min-height: 450px; padding: 20px; border: 1px solid #d1d5db; border-radius: 12px; 
    resize: vertical; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.7; background: #f8fafc; outline: none;
  }
  .textarea:focus { border-color: #2563eb; background: white; }

  .markdown-view { 
    flex: 1; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; 
    background: white; overflow-y: auto; font-size: 15px; line-height: 1.8; color: #24292e; min-height: 450px;
  }

  /* Markdown Body CSS */
  .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.4em; margin-top: 1.5em; margin-bottom: 1em; font-weight: 700; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #dfe2e5; }
  .markdown-body table th, .markdown-body table td { border: 1px solid #dfe2e5; padding: 10px 15px; text-align: left; }
  .markdown-body table tr:nth-child(2n) { background: #f6f8fa; }
  .markdown-body code { background: rgba(27,31,35,0.05); padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 90%; color: #000000ff; }
  .markdown-body pre { background: #f6f8fa; padding: 20px; border-radius: 10px; overflow: auto; border: 1px solid #e1e4e8; }

  .test-config-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 15px; padding: 30px; }
  .test-header h4 { margin: 0; color: #92400e; font-size: 18px; }
  .test-header p { margin: 6px 0 20px; color: #b45309; font-size: 14px; }

  .form-footer { border-top: 1px solid #f3f4f6; padding-top: 30px; }
  .btn { padding: 14px 28px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; font-size: 15px; }
  .btn-outline { background: white; border: 1px solid #d1d5db; color: #4b5563; }
  .btn-outline:hover { background: #f9fafb; border-color: #9ca3af; }
  .btn-primary { background: #2563eb; color: white; width: 100%; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); }

  .loading-state { text-align: center; padding: 120px; font-size: 20px; color: #64748b; font-weight: 600; }
  .access-denied { text-align: center; padding: 100px; color: #ef4444; }
`;