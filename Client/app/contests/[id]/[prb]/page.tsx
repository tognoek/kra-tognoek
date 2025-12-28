"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import SubmitModal from "../../../components/SubmitModal";

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
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [contestId, problemId, user]);

  if (loading) return <div className="loading-container">Đang nạp đề bài...</div>;

  if (error || !data || !data.problem) {
    return (
      <div className="error-page-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .error-page-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            padding: 20px;
            font-family: 'Inter', sans-serif;
          }
          .error-card {
            background: white;
            max-width: 500px;
            width: 100%;
            padding: 40px;
            border-radius: 24px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            border: 1px solid #f1f5f9;
          }
          .error-illustration {
            font-size: 80px;
            margin-bottom: 24px;
            display: inline-block;
            line-height: 1;
          }
          .error-card h2 {
            color: #0f172a;
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 12px;
          }
          .error-card p {
            color: #64748b;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          .btn-retry {
            padding: 12px 24px;
            background: #f1f5f9;
            color: #475569;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
          }
          .btn-retry:hover {
            background: #e2e8f0;
            color: #0f172a;
          }
          .btn-back-contest {
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          }
          .btn-back-contest:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
          }
        `}} />
        
        <div className="error-card">
          <div className="error-illustration">🕵️‍♂️</div>
          <h2>Không tìm thấy nội dung</h2>
          <p>
            {error || "Bài tập này không tồn tại trong hệ thống hoặc cuộc thi chưa chính thức bắt đầu để bạn có thể xem đề."}
          </p>
          <div className="error-actions">
            <button className="btn-retry" onClick={() => window.location.reload()}>
              🔄 Thử lại
            </button>
            <Link href={`/contests/${contestId}`} className="btn-back-contest">
              🏆 Về trang cuộc thi
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const { problem, contestInfo, permissions } = data;

  return (
    <div className="problem-container">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      {/* Contest Header */}
      <div className="contest-header-mini">
        <Link href={`/contests/${contestId}`} className="breadcrumb-link">
          🏆 {contestInfo.TenCuocThi}
        </Link>
        <span className="creator-tag">Tổ chức bởi: <b>{contestInfo.NguoiTaoContest}</b></span>
      </div>

      <div className="problem-main-layout">
        {/* KHUNG BÊN TRÁI: NỘI DUNG ĐỀ BÀI */}
        <div className="problem-content">
          <div className="problem-header">
            <h1>📄 {problem.TieuDe}</h1>
          </div>

          <div className="markdown-card">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
            >
              {problem.NoiDungDeBai}
            </ReactMarkdown>
          </div>
        </div>

        {/* KHUNG BÊN PHẢI: HÀNH ĐỘNG & THÔNG SỐ */}
        <div className="problem-sidebar">
          <div className="action-card">
            <h3 className="card-title">📊 Thông tin</h3>
            
            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">⏱️ Thời gian</span>
                <span className="spec-value">{problem.GioiHanThoiGian} ms</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">💾 Bộ nhớ</span>
                <span className="spec-value">{problem.GioiHanBoNho} MB</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">📈 Độ khó</span>
                <span className="spec-value difficulty-pill">{problem.DoKho}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">✍️ Tác giả</span>
                <span className="spec-value">{problem.NguoiTaoDe}</span>
              </div>
            </div>

            <hr className="divider" />

            <h3 className="card-title">🚀 Hành động</h3>
            
            {permissions.canSubmit ? (
              <button className="btn-submit-main" onClick={() => setShowSubmitModal(true)}>
                📤 NỘP BÀI NGAY
              </button>
            ) : (
              <div className="status-notice">
                {permissions.isEnded ? (
                  <p>🏁 Cuộc thi đã kết thúc.</p>
                ) : !permissions.isRegistered ? (
                  <p>🔒 Bạn chưa đăng ký thi.</p>
                ) : (
                  <p>⏳ Vui lòng chờ...</p>
                )}
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
  .problem-container { 
    max-width: 1300px; 
    margin: 0 auto; 
    padding: 30px 20px; 
    font-family: 'Inter', -apple-system, sans-serif; 
    background-color: #fcfcfd;
    min-height: 100vh;
  }

  .contest-header-mini { 
    background: #fff; 
    padding: 15px 25px; 
    border-radius: 12px; 
    margin-bottom: 25px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    border: 1px solid #eef0f2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  .breadcrumb-link { text-decoration: none; color: #2563eb; font-weight: 700; font-size: 16px; }
  .creator-tag { font-size: 14px; color: #64748b; }

  /* BỐ CỤC CHÍNH */
  .problem-main-layout { 
    display: grid; 
    grid-template-columns: 1fr 380px; /* Chia cột cân đối hơn */
    gap: 30px; 
    align-items: start;
  }

  .problem-header h1 { 
    font-size: 2.2rem; 
    color: #0f172a; 
    font-weight: 800;
    margin-bottom: 5px;
  }

  .markdown-card { 
    background: #fff; 
    padding: 40px; 
    border-radius: 16px; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.04); 
    border: 1px solid #f1f5f9; 
    line-height: 1.8;
    color: #334155;
    font-size: 16px;
  }

  /* SIDEBAR (KHUNG HÀNH ĐỘNG) */
  .action-card { 
    background: #fff; 
    padding: 28px; 
    border-radius: 16px; 
    border: 1px solid #f1f5f9; 
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    position: sticky; 
    top: 30px; 
  }

  .card-title {
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin: 0 0 20px 0;
    font-weight: 700;
  }

  .specs-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .spec-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed #f1f5f9;
  }

  .spec-label { color: #475569; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .spec-value { font-weight: 700; color: #0f172a; }

  .difficulty-pill {
    background: #eff6ff;
    color: #2563eb;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 13px;
  }

  .divider { border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0; }

  .btn-submit-main { 
    width: 100%; 
    padding: 16px; 
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white; 
    border: none; 
    border-radius: 12px; 
    font-weight: 800; 
    cursor: pointer; 
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    font-size: 15px;
  }

  .btn-submit-main:hover { 
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
  }

  .status-notice { 
    background: #fff1f2; 
    padding: 15px; 
    border-radius: 12px; 
    border: 1px solid #fecdd3; 
    text-align: center;
    color: #be123c;
    font-weight: 700;
  }

  .problem-meta {
    margin-top: 25px;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
  }

  .loading-container { padding: 100px; text-align: center; font-weight: 600; color: #64748b; }

  @media (max-width: 1024px) {
    .problem-main-layout { grid-template-columns: 1fr; }
    .action-card { position: static; }
  }
`;