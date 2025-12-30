"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import SubmitModal from "../../components/SubmitModal";
import CommentsSection from "../../components/CommentsSection";
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import { formatMemory } from "@/scripts/memory";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const pId = params.prb || params.id;
  const problemId = Array.isArray(pId) ? pId[0] : pId;

  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;
      try {
        const res = await fetch(`${API_BASE}/api/problems/${problemId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Không tìm thấy bài tập này trên hệ thống");
        const data = await res.json();
        setProblem(data);
        if (typeof document !== "undefined") {
          document.title = `${data.TieuDe || problemId} - Kra tognoek`;
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      const userStr = window.localStorage.getItem("oj_user");
      if (userStr) {
        try { setUser(JSON.parse(userStr)); } catch (e) { console.error(e); }
      }
    }
    fetchProblem();
  }, [problemId]);

  const handlePrint = () => { window.print(); };

  const getDifficultyLevel = (val: number) => {
    if (val <= 3) return { label: "Dễ", class: "diff-easy", color: "#10b981" };
    if (val <= 7) return { label: "Trung bình", class: "diff-medium", color: "#f59e0b" };
    return { label: "Khó", class: "diff-hard", color: "#ef4444" };
  };

  if (loading) return <div className="loading-state">⌛ Đang chuẩn bị nội dung bài tập...</div>;

  if (error || !problem) {
    return (
      <div className="error-container">
        <style dangerouslySetInnerHTML={{ __html: errorStyles }} />
        <div className="error-card">
          <div className="error-icon">🔍</div>
          <h2>Oops! Không tìm thấy bài tập</h2>
          <p>{error || "Bài tập không tồn tại hoặc đã bị xóa."}</p>
          <Link href="/problems" className="btn-back-home">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  const diffVal = Number(problem.DoKho) || 1;
  const diffLevel = getDifficultyLevel(diffVal);
  const inputMethod = problem.DuongDanInput ? problem.DuongDanInput : "Bàn phím (stdin)";
  const outputMethod = problem.DuongDanOutput ? problem.DuongDanOutput : "Màn hình (stdout)";

  return (
    <div className="problem-detail-wrapper">
      <style dangerouslySetInnerHTML={{ __html: modernProblemStyles }} />

      {/* Header Info */}
      <header className="problem-hero no-print">
        <div className="hero-left">
          <div className="topic-tags">
             {problem.chuDes?.map((c: any) => (
                <span key={c.IdChuDe} className="topic-badge">#{c.TenChuDe}</span>
             ))}
          </div>
          <h1 className="problem-title">{problem.TieuDe}</h1>
          <div className="author-tag">Đăng bởi <b>{problem.taiKhoan?.HoTen || "Hệ thống"}</b></div>
        </div>
        <div className="hero-right">
          {user ? (
            <button className="btn-submit-hero" onClick={() => setShowSubmitModal(true)}>🚀 Nộp bài giải</button>
          ) : (
            <div className="login-notice-hero">💡 <Link href="/auth/login">Đăng nhập</Link> để nộp bài</div>
          )}
        </div>
      </header>

      <div className="problem-grid-layout">
        {/* Cột Trái: Đề bài */}
        <main className="problem-main-content printable-area">
          <div className="content-card">
            {/* Header cho bản in (ẩn trên web) */}
            <div className="print-header">
               <h1>{problem.TieuDe}</h1>
               <div className="print-specs">
                  <div className="print-specs-row">
                    <span>⏱️ <b>Thời gian:</b> {problem.GioiHanThoiGian}ms</span>
                    <span>💾 <b>Bộ nhớ:</b> {formatMemory(problem.GioiHanBoNho)}</span>
                    <span>📈 <b>Độ khó:</b> {diffVal}/10</span>
                  </div>
                  <div className="print-specs-row">
                    <span>📥 <b>Nhập:</b> {inputMethod}</span>
                    <span>📤 <b>Xuất:</b> {outputMethod}</span>
                  </div>
               </div>
               <hr />
            </div>

            <div className="card-section-header no-print">
               <span className="icon">📄</span>
               <h3 className="section-name">Nội dung đề bài</h3>
            </div>

            <article className="markdown-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
              >
                {problem.NoiDungDeBai || "Nội dung đang được cập nhật..."}
              </ReactMarkdown>
            </article>
          </div>

          <section className="comments-section-container no-print">
            <CommentsSection problemId={problemId} user={user} />
          </section>
        </main>

        {/* Cột Phải: Thông số & Công cụ */}
        <aside className="problem-sidebar no-print">
          <div className="sidebar-card">
            <h3 className="sidebar-title">📊 Thông số kỹ thuật</h3>
            <div className="stat-list">
              <div className="stat-item">
                <div className="stat-label-row">
                    <span className="stat-label">📈 Độ khó</span>
                    <span className={`diff-status-text ${diffLevel.class}`}>{diffLevel.label}</span>
                </div>
                <div className="diff-progress-bg">
                  <div className={`diff-progress-fill ${diffLevel.class}`} style={{ width: `${diffVal * 10}%` }}></div>
                </div>
              </div>

              <div className="stat-item-row">
                <span className="icon">⏱️</span>
                <div className="stat-info">
                    <span className="stat-label">Thời gian</span>
                    <span className="stat-value">{problem.GioiHanThoiGian} ms</span>
                </div>
              </div>

              <div className="stat-item-row">
                <span className="icon">💾</span>
                <div className="stat-info">
                    <span className="stat-label">Bộ nhớ</span>
                    <span className="stat-value">{formatMemory(problem.GioiHanBoNho)}</span>
                </div>
              </div>

              <div className="stat-item-row">
                <span className="icon">📥</span>
                <div className="stat-info">
                    <span className="stat-label">Nhập từ</span>
                    <span className="stat-value highlight">{inputMethod}</span>
                </div>
              </div>

              <div className="stat-item-row">
                <span className="icon">📤</span>
                <div className="stat-info">
                    <span className="stat-label">Xuất ra</span>
                    <span className="stat-value highlight">{outputMethod}</span>
                </div>
              </div>
            </div>

            <div className="sidebar-divider"></div>

            <h3 className="sidebar-title">🛠️ Công cụ</h3>
            <div className="tool-list">
              <button className="btn-tool" onClick={handlePrint}>🖨️ In đề bài (PDF)</button>
              <Link href="/problems" className="btn-tool-outline">🔙 Quay lại danh sách</Link>
            </div>
          </div>
        </aside>
      </div>

      <SubmitModal
        open={showSubmitModal}
        problemId={problemId || ""}
        problemTitle={problem.TieuDe}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => { router.push("/submissions"); }}
      />
    </div>
  );
}

const modernProblemStyles = `
  .problem-detail-wrapper { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Inter', system-ui, sans-serif; }
  
  /* Hero Section */
  .problem-hero { display: flex; justify-content: space-between; align-items: center; background: white; padding: 40px; border-radius: 24px; border: 1px solid #e5e7eb; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
  .topic-tags { display: flex; gap: 8px; margin-bottom: 12px; }
  .topic-badge { font-size: 12px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 12px; border-radius: 99px; }
  .problem-title { font-size: 2.2rem; font-weight: 900; color: #111827; margin: 0; line-height: 1.2; }
  .author-tag { margin-top: 12px; font-size: 14px; color: #6b7280; }
  .author-tag b { color: #1f2937; }

  .btn-submit-hero { background: #2563eb; color: white; border: none; padding: 14px 35px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 15px -3px rgba(37,99,235,0.3); }
  .btn-submit-hero:hover { background: #1d4ed8; transform: translateY(-3px); box-shadow: 0 15px 20px -3px rgba(37,99,235,0.4); }
  .login-notice-hero { font-weight: 600; color: #6b7280; background: #f3f4f6; padding: 10px 20px; border-radius: 10px; }
  .login-notice-hero a { color: #2563eb; text-decoration: none; border-bottom: 2px solid transparent; }
  .login-notice-hero a:hover { border-bottom-color: #2563eb; }

  /* Main Layout */
  .problem-grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 30px; align-items: start; }
  .content-card { background: white; padding: 45px; border-radius: 24px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
  
  .card-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; color: #64748b; }
  .card-section-header .section-name { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
  .card-section-header .icon { font-size: 18px; }

  /* Sidebar */
  .sidebar-card { background: white; padding: 30px; border-radius: 24px; border: 1px solid #e5e7eb; position: sticky; top: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
  .sidebar-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 25px; letter-spacing: 0.5px; }
  .stat-list { display: flex; flex-direction: column; gap: 24px; }
  
  .stat-item { display: flex; flex-direction: column; gap: 10px; }
  .stat-label-row { display: flex; justify-content: space-between; align-items: center; }
  .stat-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
  
  .stat-item-row { display: flex; align-items: center; gap: 15px; }
  .stat-item-row .icon { font-size: 20px; width: 40px; height: 40px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
  .stat-info { display: flex; flex-direction: column; }
  .stat-value { font-size: 15px; font-weight: 700; color: #1f2937; }
  .stat-value.highlight { color: #2563eb; }

  /* Difficulty Bar */
  .diff-status-text { font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
  .diff-easy { color: #059669; background: #dcfce7; } .diff-progress-fill.diff-easy { background: #10b981; }
  .diff-medium { color: #d97706; background: #fef3c7; } .diff-progress-fill.diff-medium { background: #f59e0b; }
  .diff-hard { color: #dc2626; background: #fee2e2; } .diff-progress-fill.diff-hard { background: #ef4444; }
  .diff-progress-bg { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
  .diff-progress-fill { height: 100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }

  .sidebar-divider { height: 1px; background: #f1f5f9; margin: 30px 0; }

  /* Tools */
  .tool-list { display: flex; flex-direction: column; gap: 12px; }
  .btn-tool { background: #111827; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; text-align: center; }
  .btn-tool:hover { background: #1f2937; transform: translateY(-2px); }
  .btn-tool-outline { display: block; text-decoration: none; background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 13px; border-radius: 12px; font-weight: 700; text-align: center; transition: 0.2s; }
  .btn-tool-outline:hover { background: #f9fafb; border-color: #9ca3af; }

  /* Markdown Rendering Fixes */
  .markdown-body { line-height: 1.8; color: #374151; font-size: 16px; }
  .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #111827; margin-top: 1.5em; margin-bottom: 0.8em; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.3em; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 20px 0; }
  .markdown-body th, .markdown-body td { border: 1px solid #e5e7eb; padding: 12px 15px; text-align: left; }
  .markdown-body th { background: #f8fafc; font-weight: 700; }
  .markdown-body code { background: rgba(235, 235, 235, 0.64); color: #2563eb; padding: 0.2em 0.4em; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 90%; }
  .markdown-body pre { background: #f5f5f5ff; color: #f8fafc; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 20px 0; }
  .markdown-body pre code { background: none; color: black; padding: 0; }

  .loading-state { text-align: center; padding: 100px; font-size: 18px; color: #6b7280; font-weight: 600; }

  @media (max-width: 1024px) {
    .problem-grid-layout { grid-template-columns: 1fr; }
    .sidebar-card { position: static; }
    .problem-hero { flex-direction: column; text-align: center; gap: 20px; }
  }

  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
    .print-header { display: block !important; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
    .print-header h1 { font-size: 28pt; margin-bottom: 10pt; font-weight: bold; }
    .print-specs { display: flex; flex-direction: column; gap: 8pt; font-size: 12pt; }
    .print-specs-row { display: flex; gap: 40pt; }
    .no-print { display: none !important; }
    .content-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
    .markdown-body { font-size: 12pt; }
  }
  .print-header { display: none; }
`;

const errorStyles = `
  .error-container { display: flex; align-items: center; justify-content: center; min-height: 70vh; padding: 20px; }
  .error-card { background: white; padding: 60px; border-radius: 32px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.05); max-width: 500px; border: 1px solid #f1f5f9; }
  .error-icon { font-size: 80px; margin-bottom: 30px; }
  .error-card h2 { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 15px; }
  .error-card p { color: #6b7280; margin-bottom: 30px; line-height: 1.6; }
  .btn-back-home { background: #2563eb; color: white; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: 700; display: inline-block; transition: 0.3s; }
  .btn-back-home:hover { background: #1d4ed8; transform: translateY(-2px); }
`;