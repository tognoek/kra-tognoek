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
import SubmitModal from "../../../components/SubmitModal";
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import { formatMemory } from "@/scripts/memory";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ContestProblemDetail() {
  const params = useParams();
  const router = useRouter();
  
  const contestId = params.id as string;
  const problemId = params.prb as string; 

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("oj_user");
      if (u) setUser(JSON.parse(u));
    }
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!contestId || !problemId) return;
      try {
        const uId = user?.IdTaiKhoan || "";
        const res = await fetch(`${API_BASE}/api/contests/${contestId}/problems/${problemId}?userId=${uId}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Không thể tải đề bài");
        setData(result);
        if (typeof document !== "undefined") {
            document.title = `${result.problem.TieuDe} - ${result.contestInfo.TenCuocThi}`;
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [contestId, problemId, user]);

  if (loading) return <div className="loading-container">⌛ Đang nạp đề bài...</div>;

  if (error || !data || !data.problem) {
    return (
      <div className="error-page-container">
        <style dangerouslySetInnerHTML={{ __html: errorStyles }} />
        <div className="error-card">
          <div className="error-illustration">🕵️‍♂️</div>
          <h2>Không tìm thấy nội dung</h2>
          <p>{error || "Bài tập không tồn tại hoặc cuộc thi chưa bắt đầu."}</p>
          <div className="error-actions">
            <Link href={`/contests/${contestId}`} className="btn-back-contest">🏆 Về cuộc thi</Link>
          </div>
        </div>
      </div>
    );
  }

  const { problem, contestInfo, permissions } = data;

  const inputMethod = problem.DuongDanInput ? problem.DuongDanInput : "Bàn phím (stdin)";
  const outputMethod = problem.DuongDanOutput ? problem.DuongDanOutput : "Màn hình (stdout)";

  return (
    <div className="problem-container">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <div className="contest-header-mini no-print">
        <Link href={`/contests/${contestId}`} className="breadcrumb-link">
          🏆 {contestInfo.TenCuocThi}
        </Link>
        <span className="creator-tag">Tổ chức bởi: <b>{contestInfo.NguoiTaoContest}</b></span>
      </div>

      <div className="problem-main-layout">
        <div className="problem-content printable-area">
          <div className="problem-header">
            <h1>📄 {problem.TieuDe}</h1>
          </div>

          <div className="print-only-specs">
            <div className="print-grid">
                <div>⏱️ <b>Thời gian:</b> {problem.GioiHanThoiGian}ms</div>
                <div>💾 <b>Bộ nhớ:</b> {formatMemory(problem.GioiHanBoNho)}</div>
                <div>📈 <b>Độ khó:</b> {problem.DoKho}/10</div>
                <div>📥 <b>Nhập:</b> {inputMethod}</div>
                <div>📤 <b>Xuất:</b> {outputMethod}</div>
            </div>
            <hr className="print-divider" />
          </div>

          <div className="markdown-card markdown-body">
            {/* ĐÃ CẬP NHẬT HỖ TRỢ MARKDOWN ĐẦY ĐỦ */}
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
            >
              {problem.NoiDungDeBai}
            </ReactMarkdown>
          </div>
        </div>

        <div className="problem-sidebar no-print">
          <div className="action-card">
            <h3 className="card-title">📊 Thông số</h3>
            
            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">⏱️ Thời gian</span>
                <span className="spec-value">{problem.GioiHanThoiGian} ms</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">💾 Bộ nhớ</span>
                <span className="spec-value">{formatMemory(problem.GioiHanBoNho)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">📈 Độ khó</span>
                <span className="spec-value difficulty-pill">{problem.DoKho}/10</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">📥 Nhập từ</span>
                <span className={`spec-value ${problem.DuongDanInput ? 'file-tag' : ''}`}>{inputMethod}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">📤 Xuất ra</span>
                <span className={`spec-value ${problem.DuongDanOutput ? 'file-tag' : ''}`}>{outputMethod}</span>
              </div>
            </div>

            <hr className="divider" />

            <h3 className="card-title">🚀 Hành động</h3>
            
            {permissions.canSubmit ? (
              <button className="btn-submit-main" onClick={() => setShowSubmitModal(true)}>
                📤 NỘP BÀI GIẢI
              </button>
            ) : (
              <div className="status-notice">
                {permissions.isEnded ? "🏁 Cuộc thi kết thúc" : "🔒 Chưa đăng ký thi"}
              </div>
            )}

          </div>
        </div>
      </div>

      <SubmitModal
        open={showSubmitModal}
        problemId={problem.IdDeBai}
        problemTitle={problem.TieuDe}
        contestId={contestId}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => router.push(`/contests/${contestId}/submissions`)}
      />
    </div>
  );
}

const customStyles = `
  .problem-container { max-width: 1300px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', sans-serif; background-color: #fcfcfd; min-height: 100vh; }
  .contest-header-mini { background: #fff; padding: 15px 25px; border-radius: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eef0f2; }
  .breadcrumb-link { text-decoration: none; color: #2563eb; font-weight: 700; }
  
  .problem-main-layout { display: grid; grid-template-columns: 1fr 380px; gap: 30px; align-items: start; }
  .problem-header h1 { font-size: 2.2rem; color: #0f172a; font-weight: 800; margin-bottom: 20px; }
  
  .markdown-card { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; line-height: 1.8; color: #334155; font-size: 16px; }

  /* GitHub Flavored Markdown Sync */
  .markdown-body h1, .markdown-body h2 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-bottom: 16px; margin-top: 24px; font-weight: 700; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #dfe2e5; }
  .markdown-body table th, .markdown-body table td { border: 1px solid #dfe2e5; padding: 10px 15px; text-align: left; }
  .markdown-body table tr:nth-child(2n) { background: #f6f8fa; }
  .markdown-body code { background: rgba(37, 99, 235, 0.05); padding: 3px 6px; border-radius: 4px; font-family: monospace; color: #000000ff; }
  .markdown-body pre { background: #e6e6e6ff; color: #000000ff; padding: 20px; border-radius: 12px; overflow: auto; }

  .action-card { background: #fff; padding: 28px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); position: sticky; top: 30px; }
  .card-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin: 0 0 20px 0; font-weight: 700; }
  
  .specs-list { display: flex; flex-direction: column; gap: 14px; }
  .spec-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; }
  .spec-label { color: #475569; font-size: 14px; font-weight: 500; }
  .spec-value { font-weight: 700; color: #0f172a; font-size: 14px; }
  
  .difficulty-pill { background: #eff6ff; color: #2563eb; padding: 2px 10px; border-radius: 99px; }
  .file-tag { color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  
  .divider { border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0; }
  
  .btn-submit-main { width: 100%; padding: 16px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; margin-bottom: 12px; }
  .btn-submit-main:hover { background: #1d4ed8; transform: translateY(-2px); }
  
  .status-notice { background: #fff1f2; padding: 15px; border-radius: 12px; text-align: center; color: #be123c; font-weight: 700; margin-bottom: 12px; }
  .loading-container { padding: 100px; text-align: center; font-weight: 600; color: #64748b; }

  /* PRINT STYLES */
  .print-only-specs { display: none; }
  @media print {
    .no-print { display: none !important; }
    .problem-container { padding: 0; background: white; }
    .problem-main-layout { display: block; }
    .markdown-card { box-shadow: none; border: none; padding: 0; }
    .print-only-specs { display: block; margin-bottom: 30px; }
    .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12pt; }
    .print-divider { margin-top: 15px; border: 0; border-top: 1px solid #000; }
  }
`;

const errorStyles = `
  .error-page-container { display: flex; align-items: center; justify-content: center; min-height: 70vh; font-family: 'Inter', sans-serif; }
  .error-card { background: white; padding: 40px; border-radius: 24px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
  .error-illustration { font-size: 60px; margin-bottom: 20px; }
  .btn-back-contest { padding: 12px 24px; background: #2563eb; color: white; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; }
`;