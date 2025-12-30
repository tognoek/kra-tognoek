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

interface Topic {
  IdChuDe: number;
  TenChuDe: string;
}

export default function EditProblemPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params?.id;

  const [loading, setLoading] = useState(true);
  const [TieuDe, setTieuDe] = useState("");
  const [NoiDungDeBai, setNoiDungDeBai] = useState("");
  const [DoKho, setDoKho] = useState("1");
  const [GioiHanThoiGian, setTimeLimit] = useState(1000);
  const [GioiHanBoNho, setMemoryLimit] = useState(256);
  const [DangCongKhai, setPublic] = useState(true);
  const [TrangThai, setStatus] = useState(true);

  const [testFile, setTestFile] = useState<File | null>(null);
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [checkerPath, setCheckerPath] = useState("");

  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resTopics = await fetch(`${API_BASE}/api/topics`);
        if (resTopics.ok) setAvailableTopics(await resTopics.json());
        if (problemId) {
          const resProb = await fetch(`${API_BASE}/api/problems/${problemId}`);
          if (resProb.ok) {
            const data = await resProb.json();
            setTieuDe(data.TieuDe);
            setNoiDungDeBai(data.NoiDungDeBai);
            setDoKho(String(data.DoKho));
            setTimeLimit(data.GioiHanThoiGian);
            setMemoryLimit(data.GioiHanBoNho);
            setPublic(data.DangCongKhai);
            setStatus(data.TrangThai);
            if (data.topicIds && Array.isArray(data.topicIds)) {
              setSelectedTopics(data.topicIds.map((id: any) => Number(id)));
            }
          }
        }
      } catch (e) {
        toast.error("Lỗi kết nối server.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [problemId]);

  const handleTopicChange = (topicId: number) => {
    setSelectedTopics(prev => prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Đang lưu thay đổi...");
    try {
      const res = await fetch(`${API_BASE}/api/creator_problem/${problemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TieuDe, NoiDungDeBai, DoKho, GioiHanThoiGian, GioiHanBoNho, DangCongKhai, TrangThai, topicIds: selectedTopics,
        }),
      });
      if (!res.ok) throw new Error("Cập nhật thông tin thất bại");
      if (testFile) {
        const base64 = await fileToBase64(testFile);
        const uploadRes = await fetch(`${API_BASE}/api/upload/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64, originalName: testFile.name, problemId: problemId,
            inputPath: inputPath || null, outputPath: outputPath || null, checkerPath: checkerPath || null,
          }),
        });
        if (!uploadRes.ok) throw new Error("Cập nhật bộ test thất bại");
      }
      toast.update(toastId, { render: "Cập nhật thành công!", type: "success", isLoading: false, autoClose: 1500 });
      setTimeout(() => { router.push("/creator/problems"); }, 1500);
    } catch (e: any) {
      toast.update(toastId, { render: e.message || "Lỗi không xác định", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-state">⌛ Đang nạp dữ liệu bài tập...</div>;

  return (
    <div className="edit-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <ToastContainer position="top-right" autoClose={2000} transition={Slide} />

      <div className="main-card">
        <div className="card-header">
          <div>
             <h1 className="page-title">⚙️ Chỉnh sửa bài tập #{problemId}</h1>
             <p className="page-subtitle">Cập nhật nội dung, giới hạn và bộ test cho bài toán.</p>
          </div>
          <button className="btn btn-outline" onClick={() => router.back()}>← Quay lại</button>
        </div>
        
        <form onSubmit={onSubmit} className="form-content">
          
          {/* SECTION 1: THÔNG TIN CHUNG */}
          <div className="form-section">
            <h3 className="section-title">📝 Thông tin cơ bản</h3>
            
            <div className="form-group full-width">
              <label className="label">Tiêu đề bài tập</label>
              <input className="input" value={TieuDe} onChange={(e) => setTieuDe(e.target.value)} placeholder="Nhập tiêu đề..." required />
            </div>

            <div className="row-3-cols">
               <div className="form-group">
                  <label className="label">Độ khó (1-10)</label>
                  <select className="select" value={DoKho} onChange={(e) => setDoKho(e.target.value)}>
                     {[...Array(10)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1} - {i+1<=3 ? 'Dễ' : i+1<=7 ? 'T.Bình' : 'Khó'}</option>
                     ))}
                  </select>
               </div>
               <div className="form-group">
                  <label className="label">Chế độ hiển thị</label>
                  <select className="select" value={DangCongKhai ? "true" : "false"} onChange={(e) => setPublic(e.target.value === "true")}>
                    <option value="true">🌎 Công khai</option>
                    <option value="false">🔒 Riêng tư</option>
                  </select>
               </div>
               <div className="form-group">
                  <label className="label">Trạng thái bài</label>
                  <select className={`select ${TrangThai ? 'status-active' : 'status-inactive'}`} value={TrangThai ? "true" : "false"} onChange={(e) => setStatus(e.target.value === "true")}>
                    <option value="true">✅ Đang hoạt động</option>
                    <option value="false">⛔ Đang tạm khóa</option>
                  </select>
               </div>
            </div>

            <div className="form-group full-width">
              <label className="label">Chủ đề bài tập (Tags)</label>
              <div className="tags-wrapper">
                {availableTopics.map(topic => {
                  const topicId = Number(topic.IdChuDe);
                  const isSelected = selectedTopics.includes(topicId);
                  return (
                    <label key={topicId} className={`tag-pill ${isSelected ? 'active' : ''}`}>
                      <input type="checkbox" hidden checked={isSelected} onChange={() => handleTopicChange(topicId)} />
                      {topic.TenChuDe}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: NỘI DUNG ĐỀ BÀI (Markdown + Preview) */}
          <div className="form-section">
            <h3 className="section-title">📄 Nội dung đề bài</h3>
            <div className="editor-layout">
               <div className="editor-col">
                  <label className="sub-label">Biên soạn (Markdown)</label>
                  <textarea 
                    className="textarea code-font" 
                    value={NoiDungDeBai} 
                    onChange={(e) => setNoiDungDeBai(e.target.value)} 
                    placeholder="Sử dụng Markdown để soạn thảo..."
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
                        {NoiDungDeBai || "*Chưa có nội dung đề bài...*"}
                      </ReactMarkdown>
                  </div>
               </div>
            </div>
          </div>

          {/* SECTION 3: CẤU HÌNH KỸ THUẬT */}
          <div className="form-section">
            <h3 className="section-title">⚙️ Thông số giới hạn & Bộ test</h3>
            
            <div className="row-2-cols">
               <div className="form-group">
                  <label className="label">Giới hạn thời gian (ms)</label>
                  <input type="number" className="input" value={GioiHanThoiGian} onChange={(e) => setTimeLimit(Number(e.target.value))} />
               </div>
               <div className="form-group">
                  <label className="label">Giới hạn bộ nhớ (KB)</label>
                  <input type="number" className="input" value={GioiHanBoNho} onChange={(e) => setMemoryLimit(Number(e.target.value))} />
               </div>
            </div>

            <div className="test-config-box">
               <div className="test-header">
                  <h4>⚠️ Cấu hình dữ liệu Test Case</h4>
                  <p>Hãy tải lên file .zip chứa toàn bộ các cặp file Input/Output.</p>
               </div>
               
               <div className="row-3-cols">
                  <div className="form-group">
                    <label className="label">Tên File Input</label>
                    <input className="input" value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder="VD: data.inp" />
                  </div>
                  <div className="form-group">
                    <label className="label">Tên File Output</label>
                    <input className="input" value={outputPath} onChange={(e) => setOutputPath(e.target.value)} placeholder="VD: data.out" />
                  </div>
                  <div className="form-group">
                    <label className="label">File Checker</label>
                    <input className="input" value={checkerPath} onChange={(e) => setCheckerPath(e.target.value)} placeholder="VD: check.cpp" />
                  </div>
               </div>

               <div className="form-group full-width" style={{marginTop: '20px'}}>
                  <label className="label">Chọn file nén dữ liệu (.zip)</label>
                  <input type="file" accept=".zip" className="file-input" onChange={(e) => setTestFile(e.target.files?.[0] || null)} />
               </div>
            </div>
          </div>

          <div className="form-footer">
             <button type="submit" className="btn btn-primary" disabled={saving}>
               {saving ? "⌛ Đang lưu lại..." : "💾 Cập nhật bài tập"}
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
  .sub-label { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 5px; }
  
  .input, .select { padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; transition: 0.2s; background: white; }
  .input:focus, .select:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); outline: none; }

  .status-active { color: #065f46; background: #ecfdf5; border-color: #10b981; }
  .status-inactive { color: #991b1b; background: #fef2f2; border-color: #f87171; }

  .tags-wrapper { display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
  .tag-pill { font-size: 13px; padding: 8px 18px; border-radius: 30px; border: 1px solid #d1d5db; background: white; cursor: pointer; transition: 0.2s; font-weight: 500; }
  .tag-pill:hover { border-color: #2563eb; color: #2563eb; }
  .tag-pill.active { background: #2563eb; border-color: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2); }

  /* EDITOR LAYOUT FIX: Không còn bị đè nội dung */
  .editor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; min-height: 450px; height: auto; align-items: stretch; }
  .editor-col, .preview-col { display: flex; flex-direction: column; gap: 12px; }
  
  .textarea { 
    flex: 1; min-height: 450px; padding: 20px; border: 1px solid #d1d5db; border-radius: 12px; 
    resize: vertical; font-family: 'Fira Code', monospace; font-size: 14px; line-height: 1.7; background: #f8fafc;
  }
  .textarea:focus { border-color: #2563eb; background: white; outline: none; }

  .markdown-view { 
    flex: 1; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; 
    background: white; overflow-y: auto; font-size: 15px; line-height: 1.8; color: #24292e; min-height: 450px;
  }

  /* Markdown CSS Styles */
  .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.4em; margin-top: 1.5em; margin-bottom: 1em; font-weight: 700; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #dfe2e5; }
  .markdown-body table th, .markdown-body table td { border: 1px solid #dfe2e5; padding: 10px 15px; text-align: left; }
  .markdown-body table tr:nth-child(2n) { background: #f6f8fa; }
  .markdown-body code {padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 90%; color: #000000ff; }
  .markdown-body pre { background: #f6f8fa; padding: 20px; border-radius: 10px; overflow: auto; border: 1px solid #e1e4e8; }
  .markdown-body pre code { background: none; color: black; padding: 0; }

  .test-config-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 15px; padding: 30px; }
  .test-header h4 { margin: 0; color: #92400e; font-size: 18px; }
  .test-header p { margin: 6px 0 20px; color: #b45309; font-size: 14px; }

  .form-footer { border-top: 1px solid #f3f4f6; padding-top: 30px; margin-top: 10px; }
  .btn { padding: 14px 28px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; border: none; font-size: 15px; }
  .btn-outline { background: white; border: 1px solid #d1d5db; color: #4b5563; }
  .btn-outline:hover { background: #f9fafb; border-color: #9ca3af; }
  .btn-primary { background: #2563eb; color: white; width: 100%; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(37,99,235,0.3); }

  .loading-state { text-align: center; padding: 120px; font-size: 20px; color: #64748b; font-weight: 600; }
`;