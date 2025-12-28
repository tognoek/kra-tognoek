"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import SubmitModal from "../../components/SubmitModal";
import CommentsSection from "../../components/CommentsSection";

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
          document.title = `${data.TieuDe || problemId} - OJ Portal`;
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
    if (val <= 3) return { label: "Easy", class: "diff-easy" };
    if (val <= 7) return { label: "Medium", class: "diff-medium" };
    return { label: "Hard", class: "diff-hard" };
  };

  if (loading) return <div className="loading-state">⌛ Đang chuẩn bị nội dung bài tập...</div>;

  if (error || !problem) {
    return (
      <div className="error-container">
        <style dangerouslySetInnerHTML={{ __html: errorStyles }} />
        <div className="error-card">
          <div className="error-icon">🔍</div>
          <h2>Không tìm thấy bài tập</h2>
          <p>{error || "Bài tập không tồn tại hoặc đã bị xóa."}</p>
          <Link href="/problems" className="btn-back-home">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  const diffVal = Number(problem.DoKho) || 1;
  const diffLevel = getDifficultyLevel(diffVal);

  // Logic xử lý phương thức nhập xuất
  const inputMethod = problem.DuongDanInput ? problem.DuongDanInput : "Bàn phím (stdin)";
  const outputMethod = problem.DuongDanOutput ? problem.DuongDanOutput : "Màn hình (stdout)";

  return (
    <div className="problem-detail-wrapper">
      <style dangerouslySetInnerHTML={{ __html: modernProblemStyles }} />

      {/* Hero Header */}
      <header className="problem-hero no-print">
        <div className="hero-left">
          <h1 className="problem-title">📄 {problem.TieuDe}</h1>
          <div className="author-tag">Tác giả: <b>{problem.taiKhoan?.HoTen || "Hệ thống"}</b></div>
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
            {/* Header cho bản in */}
            <div className="print-header">
               <h1>{problem.TieuDe}</h1>
               <div className="print-specs">
                  <div className="print-specs-row">
                    <span>⏱️ <b>Thời gian:</b> {problem.GioiHanThoiGian}ms</span>
                    <span>💾 <b>Bộ nhớ:</b> {problem.GioiHanBoNho}MB</span>
                    <span>📈 <b>Độ khó:</b> {diffVal}/10</span>
                  </div>
                  <div className="print-specs-row">
                    <span>📥 <b>Nhập từ:</b> {inputMethod}</span>
                    <span>📤 <b>Xuất ra:</b> {outputMethod}</span>
                  </div>
               </div>
               <hr />
            </div>

            <h3 className="card-title-internal no-print">📝 Mô tả đề bài</h3>
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                {problem.NoiDungDeBai || "Nội dung đang được cập nhật..."}
              </ReactMarkdown>
            </article>
          </div>

          <section className="comments-section-container no-print">
            <CommentsSection problemId={problemId} user={user} />
          </section>
        </main>

        {/* Cột Phải: Thông số */}
        <aside className="problem-sidebar no-print">
          <div className="sidebar-card">
            <h3 className="sidebar-title">📊 Thông số kỹ thuật</h3>
            <div className="stat-list">
              <div className="stat-item">
                <span className="stat-label">📈 Độ khó ({diffVal}/10)</span>
                <div className="diff-bar-container">
                  <div className="diff-bar-labels">
                    <span className={`diff-status-text ${diffLevel.class}`}>{diffLevel.label}</span>
                  </div>
                  <div className="diff-progress-bg">
                    <div className={`diff-progress-fill ${diffLevel.class}`} style={{ width: `${diffVal * 10}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="stat-item">
                <span className="stat-label">⏱️ Giới hạn thời gian</span>
                <span className="stat-value">{problem.GioiHanThoiGian} ms</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">💾 Giới hạn bộ nhớ</span>
                <span className="stat-value">{problem.GioiHanBoNho} MB</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">📥 Dữ liệu vào</span>
                <span className={`stat-value ${problem.DuongDanInput ? "text-highlight" : ""}`}>{inputMethod}</span>
              </div>

              <div className="stat-item">
                <span className="stat-label">📤 Dữ liệu ra</span>
                <span className={`stat-value ${problem.DuongDanOutput ? "text-highlight" : ""}`}>{outputMethod}</span>
              </div>
            </div>

            <div className="sidebar-divider"></div>

            <h3 className="sidebar-title">⚙️ Công cụ</h3>
            <div className="tool-list">
              <button className="btn-tool" onClick={handlePrint}>🖨️ In đề bài</button>
              <Link href="/problems" className="btn-tool-link">🔙 Danh sách đề</Link>
            </div>
          </div>
        </aside>
      </div>

      <SubmitModal
        open={showSubmitModal}
        problemId={problemId || ""}
        problemTitle={problem.TieuDe}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => { window.location.href = "/submissions"; }}
      />
    </div>
  );
}

const modernProblemStyles = `
  .problem-detail-wrapper { max-width: 1300px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', system-ui, sans-serif; }
  
  .problem-hero { display: flex; justify-content: space-between; align-items: center; background: white; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
  .problem-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; }
  .author-tag { margin-top: 10px; font-size: 14px; color: #64748b; }
  .author-tag b { color: #1e293b; }

  .btn-submit-hero { background: #2563eb; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
  .btn-submit-hero:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(37,99,235,0.3); }

  .problem-grid-layout { display: grid; grid-template-columns: 1fr 340px; gap: 30px; align-items: start; }
  .content-card { background: white; padding: 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
  .card-title-internal { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 25px; border-left: 4px solid #2563eb; padding-left: 15px; }

  .sidebar-card { background: white; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; position: sticky; top: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
  .sidebar-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 20px; }
  .stat-list { display: flex; flex-direction: column; gap: 20px; }
  .stat-item { display: flex; flex-direction: column; gap: 8px; }
  .stat-label { font-size: 13px; font-weight: 600; color: #64748b; }
  .stat-value { font-size: 16px; font-weight: 700; color: #0f172a; }
  .text-highlight { color: #2563eb; }

  .diff-bar-container { display: flex; flex-direction: column; gap: 6px; }
  .diff-status-text { font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .diff-progress-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
  .diff-progress-fill { height: 100%; transition: width 0.6s ease; }
  
  .diff-easy { color: #16a34a; } .diff-progress-fill.diff-easy { background: #22c55e; }
  .diff-medium { color: #d97706; } .diff-progress-fill.diff-medium { background: #f59e0b; }
  .diff-hard { color: #dc2626; } .diff-progress-fill.diff-hard { background: #ef4444; }

  .sidebar-divider { height: 1px; background: #f1f5f9; margin: 25px 0; }

  .tool-list { display: flex; flex-direction: column; gap: 10px; }
  .btn-tool, .btn-tool-link { display: block; width: 100%; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center; color: #475569; font-weight: 600; text-decoration: none; cursor: pointer; transition: 0.2s; }
  .btn-tool:hover, .btn-tool-link:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }

  .markdown-body { line-height: 1.8; color: #334155; font-size: 16px; }

  @media (max-width: 1024px) {
    .problem-grid-layout { grid-template-columns: 1fr; }
    .sidebar-card { position: static; }
  }

  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
    .print-header { display: block !important; margin-bottom: 30px; }
    .print-header h1 { font-size: 24pt; margin-bottom: 10pt; }
    .print-specs { display: flex; flex-direction: column; gap: 10pt; font-size: 12pt; }
    .print-specs-row { display: flex; gap: 40pt; }
    .no-print { display: none !important; }
    .content-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
  }
  .print-header { display: none; }
`;

const errorStyles = `
  .error-container { display: flex; align-items: center; justify-content: center; min-height: 70vh; }
  .error-card { background: white; padding: 50px; border-radius: 24px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); max-width: 450px; border: 1px solid #f1f5f9; }
  .error-icon { font-size: 60px; margin-bottom: 20px; }
  .btn-back-home { background: #2563eb; color: white; text-decoration: none; padding: 12px 25px; border-radius: 12px; font-weight: 600; display: inline-block; transition: 0.2s; }
`;