"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  
  // State dữ liệu
  const [TieuDe, setTieuDe] = useState("");
  const [NoiDungDeBai, setNoiDungDeBai] = useState("");
  const [DoKho, setDoKho] = useState("1");
  const [GioiHanThoiGian, setTimeLimit] = useState(1000);
  const [GioiHanBoNho, setMemoryLimit] = useState(256);
  const [DangCongKhai, setPublic] = useState(true);
  const [TrangThai, setStatus] = useState(true);

  // State bộ test
  const [testFile, setTestFile] = useState<File | null>(null);
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [checkerPath, setCheckerPath] = useState("");

  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Load dữ liệu
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
            const topicIdsNumber = data.topicIds.map((id: any) => Number(id));
            setSelectedTopics(topicIdsNumber);
          }
          } else {
             toast.error("Không tìm thấy bài tập.");
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
      const res = await fetch(`${API_BASE}/api/problems/${problemId}`, {
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

  if (loading) return <div className="loading-state">Đang tải dữ liệu...</div>;

  return (
    <div className="edit-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <ToastContainer position="top-right" autoClose={2000} transition={Slide} />

      <div className="main-card">
        {/* HEADER */}
        <div className="card-header">
          <div>
             <h1 className="page-title">Chỉnh sửa bài tập #{problemId}</h1>
             <p className="page-subtitle">Cập nhật thông tin và cấu hình bài toán.</p>
          </div>
          <button className="btn btn-outline" onClick={() => router.back()}>← Quay lại</button>
        </div>
        
        <form onSubmit={onSubmit} className="form-content">
          
          {/* Section 1: Thông tin cơ bản */}
          <div className="form-section">
            <h3 className="section-title">📝 Thông tin chung</h3>
            
            <div className="form-group full-width">
              <label className="label">Tiêu đề bài tập</label>
              <input className="input" value={TieuDe} onChange={(e) => setTieuDe(e.target.value)} required />
            </div>

            <div className="row-3-cols">
               <div className="form-group">
                  <label className="label">Độ khó</label>
                  <select className="select" value={DoKho} onChange={(e) => setDoKho(e.target.value)}>
                     {[...Array(10)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1} - {i+1<=3 ? 'Dễ' : i+1<=7 ? 'TB' : 'Khó'}</option>
                     ))}
                  </select>
               </div>
               <div className="form-group">
                  <label className="label">Hiển thị</label>
                  <select className="select" value={DangCongKhai ? "true" : "false"} onChange={(e) => setPublic(e.target.value === "true")}>
                    <option value="true">🌎 Công khai</option>
                    <option value="false">🔒 Riêng tư</option>
                  </select>
               </div>
               <div className="form-group">
                  <label className="label">Trạng thái</label>
                  <select className={`select ${TrangThai ? 'status-active' : 'status-inactive'}`} value={TrangThai ? "true" : "false"} onChange={(e) => setStatus(e.target.value === "true")}>
                    <option value="true">✅ Đang mở</option>
                    <option value="false">⛔ Tạm khóa</option>
                  </select>
               </div>
            </div>

            <div className="form-group full-width">
              <label className="label">Chủ đề (Tags)</label>
              <div className="tags-wrapper">
                {availableTopics.map(topic => {
                  // 1. Chuyển IdChuDe của từng topic về Number để so sánh an toàn
                  const topicId = Number(topic.IdChuDe);
                  const isSelected = selectedTopics.includes(topicId);

                  return (
                    <label 
                      key={topicId} 
                      className={`tag-pill ${isSelected ? 'active' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        hidden 
                        checked={isSelected} 
                        onChange={() => handleTopicChange(topicId)} 
                      />
                      {topic.TenChuDe}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Nội dung đề bài */}
          <div className="form-section">
            <h3 className="section-title">📄 Nội dung đề bài</h3>
            <div className="editor-layout">
               <div className="editor-col">
                  <label className="sub-label">Soạn thảo (Markdown)</label>
                  <textarea className="textarea code-font" value={NoiDungDeBai} onChange={(e) => setNoiDungDeBai(e.target.value)} rows={15} required />
               </div>
               <div className="preview-col">
                  <label className="sub-label">Xem trước</label>
                  <div className="markdown-view">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{NoiDungDeBai}</ReactMarkdown>
                  </div>
               </div>
            </div>
          </div>

          {/* Section 3: Cấu hình Test */}
          <div className="form-section">
            <h3 className="section-title">⚙️ Cấu hình Kỹ thuật & Test Data</h3>
            
            <div className="row-2-cols">
               <div className="form-group">
                  <label className="label">Thời gian (ms)</label>
                  <input type="number" className="input" value={GioiHanThoiGian} onChange={(e) => setTimeLimit(Number(e.target.value))} />
               </div>
               <div className="form-group">
                  <label className="label">Bộ nhớ (MB)</label>
                  <input type="number" className="input" value={GioiHanBoNho} onChange={(e) => setMemoryLimit(Number(e.target.value))} />
               </div>
            </div>

            <div className="test-config-box">
               <div className="test-header">
                  <h4>⚠️ Cập nhật Bộ Test (Ghi đè)</h4>
                  <p>Chỉ upload file nếu bạn muốn thay thế toàn bộ test case cũ.</p>
               </div>
               
               <div className="row-3-cols">
                  <div className="form-group">
                    <label className="label">File Input</label>
                    <input className="input" value={inputPath} onChange={(e) => setInputPath(e.target.value)} placeholder="VD: bai1.inp" />
                  </div>
                  <div className="form-group">
                    <label className="label">File Output</label>
                    <input className="input" value={outputPath} onChange={(e) => setOutputPath(e.target.value)} placeholder="VD: bai1.out" />
                  </div>
                  <div className="form-group">
                    <label className="label">Checker</label>
                    <input className="input" value={checkerPath} onChange={(e) => setCheckerPath(e.target.value)} placeholder="VD: check.cpp" />
                  </div>
               </div>

               <div className="form-group full-width" style={{marginTop: '15px'}}>
                  <label className="label">Upload File .zip mới</label>
                  <input type="file" accept=".zip" className="file-input" onChange={(e) => setTestFile(e.target.files?.[0] || null)} />
               </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="form-footer">
             <button type="submit" className="btn btn-primary" disabled={saving}>
               {saving ? "Đang lưu..." : "💾 Lưu Thay Đổi"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ==========================================
// CSS STYLES
// ==========================================
const pageStyles = `
  /* Global */
  .edit-page-wrapper {
    max-width: 1000px; margin: 40px auto; padding: 0 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #374151; background-color: #f9fafb; min-height: 100vh;
  }
  .loading-state { text-align: center; margin-top: 100px; color: #6b7280; }

  /* Card */
  .main-card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow: hidden; }
  
  /* Header */
  .card-header { padding: 24px 32px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
  .page-title { font-size: 22px; font-weight: 800; color: #111827; margin: 0; }
  .page-subtitle { margin: 4px 0 0; font-size: 14px; color: #6b7280; }

  /* Form Layout */
  .form-content { padding: 32px; display: flex; flex-direction: column; gap: 40px; }
  .form-section { display: flex; flex-direction: column; gap: 20px; }
  .section-title { font-size: 16px; font-weight: 700; color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin: 0; display: flex; align-items: center; gap: 8px; }
  
  .row-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .row-3-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .full-width { grid-column: 1 / -1; }

  /* Inputs */
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .label { font-size: 13px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
  .sub-label { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
  
  .input, .select, .textarea { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 100%; box-sizing: border-box; transition: 0.2s; background: white; }
  .input:focus, .select:focus, .textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); outline: none; }
  .code-font { font-family: monospace; }
  .file-input { font-size: 14px; }

  /* Status Colors */
  .status-active { border-color: #10b981; color: #065f46; background: #ecfdf5; }
  .status-inactive { border-color: #ef4444; color: #991b1b; background: #fef2f2; }

  /* Tags */
  .tags-wrapper { display: flex; flex-wrap: wrap; gap: 10px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
  .tag-pill { font-size: 13px; padding: 6px 14px; border-radius: 20px; border: 1px solid #d1d5db; background: white; cursor: pointer; transition: 0.2s; user-select: none; }
  .tag-pill:hover { border-color: #9ca3af; }
  .tag-pill.active { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; font-weight: 600; }

  /* Editor */
  .editor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 400px; }
  .editor-col, .preview-col { display: flex; flex-direction: column; height: 100%; }
  .textarea { flex: 1; resize: none; }
  .markdown-view { flex: 1; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; overflow-y: auto; font-size: 14px; line-height: 1.6; }

  /* Test Config Box */
  .test-config-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-top: 10px; }
  .test-header { margin-bottom: 16px; border-bottom: 1px dashed #fcd34d; padding-bottom: 10px; }
  .test-header h4 { margin: 0; color: #92400e; font-size: 15px; }
  .test-header p { margin: 4px 0 0; color: #b45309; font-size: 13px; }

  /* Footer */
  .form-footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  
  /* Buttons */
  .btn { padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: 0.2s; }
  .btn-outline { background: white; border: 1px solid #d1d5db; color: #374151; }
  .btn-outline:hover { background: #f3f4f6; }
  .btn-primary { background: #2563eb; color: white; width: 100%; padding: 14px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; transform: none; }

  /* Responsive */
  @media (max-width: 768px) {
    .row-2-cols, .row-3-cols, .editor-layout { grid-template-columns: 1fr; }
    .editor-layout { height: auto; }
    .textarea { min-height: 200px; }
    .markdown-view { min-height: 200px; }
  }
`;