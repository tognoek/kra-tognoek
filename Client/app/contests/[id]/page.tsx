"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import { formatMemory } from "@/scripts/memory";

// Badge Trạng thái đồng bộ màu sắc mới
const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = { 
    "Đang thi": "#2563eb",  // Xanh dương
    "Sắp mở": "#10b981",    // Xanh lá
    "Kết thúc": "#64748b",  // Xám
    "Đóng": "#ef4444"       // Đỏ
  };
  return (
    <span style={{ 
      background: colors[status] || "#64748b", 
      color: "white", 
      padding: "4px 12px", 
      borderRadius: "99px", 
      fontSize: "0.75rem", 
      fontWeight: 700,
      textTransform: "uppercase"
    }}>
      {status}
    </span>
  );
};

const DifficultyBadge = ({ difficulty }: { difficulty: any }) => {
  const val = Number(difficulty);
  const color = val <= 3 ? "#22c55e" : val <= 7 ? "#f59e0b" : "#ef4444";
  return <span style={{ color, fontWeight: 700 }}>{val}/10</span>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contest, setContest] = useState<any>(null);
  const [rankData, setRankData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const uStr = localStorage.getItem("oj_user");
    if (uStr) setUser(JSON.parse(uStr));
  }, []);

  const fetchContest = useCallback(async () => {
    try {
      const uStr = localStorage.getItem("oj_user");
      const uId = uStr ? JSON.parse(uStr).IdTaiKhoan : "";
      
      const res = await fetch(`${API_BASE}/api/contests/${params.id}?userId=${uId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải dữ liệu");
      const data = await res.json();

      const now = new Date();
      const start = new Date(data.ThoiGianBatDau);
      const end = new Date(data.ThoiGianKetThuc);
      let statusText = "Kết thúc";
      if (!data.TrangThai) statusText = "Đóng";
      else if (now < start) statusText = "Sắp mở";
      else if (now >= start && now <= end) statusText = "Đang thi";
      
      data.vnStatus = statusText;
      setContest(data);

      if (statusText !== "Sắp mở") {
        const rankRes = await fetch(`${API_BASE}/api/ranks/${params.id}`);
        if (rankRes.ok) {
          const rData = await rankRes.json();
          setRankData(rData.leaderboard.slice(0, 3));
        }
      }
      if (typeof document !== "undefined") {
        document.title = `${data.TenCuocThi}- Kra tognoek`;
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) fetchContest();
  }, [params.id, user, fetchContest]);

  const handleAction = async (action: "register" | "unregister") => {
    if (!user) return router.push("/auth/login");
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/contests/${params.id}/${action}`, {
        method: action === "register" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IdTaiKhoan: user.IdTaiKhoan }),
      });
      if (res.ok) {
        toast.success(action === "register" ? "🎉 Đăng ký thành công!" : "🔔 Đã hủy đăng ký!");
        await fetchContest();
      }
    } catch (e) { toast.error("Lỗi kết nối"); }
    finally { setProcessing(false); }
  };

  if (loading) return (
      <div className="contest-page animate-pulse">
        <style dangerouslySetInnerHTML={{ __html: contestStyles }} />
        <div className="top-nav">
          <div className="skeleton" style={{ width: '200px', height: '30px', borderRadius: '12px' }}></div>
        </div>

        {/* Skeleton Header */}
        <div className="contest-header-compact" style={{ background: '#334155' }}>
          <div className="skeleton" style={{ width: '60%', height: '35px', marginBottom: '15px', background: '#475569' }}></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px', background: '#475569' }}></div>
            <div className="skeleton" style={{ width: '120px', height: '24px', borderRadius: '20px', background: '#475569' }}></div>
          </div>
        </div>

        <div className="contest-body-layout">
          <div className="main-content">
            {/* Skeleton Description */}
            <div className="content-card">
              <div className="skeleton" style={{ width: '30%', height: '20px', marginBottom: '20px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '15px', marginBottom: '10px' }}></div>
              <div className="skeleton" style={{ width: '90%', height: '15px', marginBottom: '10px' }}></div>
              <div className="skeleton" style={{ width: '40%', height: '15px' }}></div>
            </div>

            {/* Skeleton Table */}
            <div className="content-card">
              <div className="skeleton" style={{ width: '40%', height: '20px', marginBottom: '20px' }}></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ width: '100%', height: '50px', marginBottom: '10px', borderRadius: '8px' }}></div>
              ))}
            </div>
          </div>

          <aside className="sidebar">
            {[1, 2].map(i => (
              <div key={i} className="side-card">
                <div className="skeleton" style={{ width: '50%', height: '15px', marginBottom: '15px' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '12px', marginBottom: '10px' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '12px' }}></div>
              </div>
            ))}
          </aside>
        </div>

        <style jsx>{`
          .skeleton {
            background: #e2e8f0;
            background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
            background-size: 200% 100%;
            animation: loading-shimmer 1.5s infinite;
            border-radius: 4px;
          }

          @keyframes loading-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .85; }
          }
        `}</style>
      </div>
    );
  if (!contest) return (
      <div className="contest-page">
        <style dangerouslySetInnerHTML={{ __html: contestStyles }} />
        <div className="error-container-glass">
          <div className="error-icon-box">⚠️</div>
          <h1 className="error-title">Không tìm thấy cuộc thi</h1>
          <p className="error-desc">
            Xin lỗi, cuộc thi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống. 
            Vui lòng kiểm tra lại đường dẫn hoặc quay về danh sách để tìm cuộc thi khác.
          </p>
          <Link href="/contests" className="btn btn-primary" style={{marginTop: '20px'}}>
            Khám phá cuộc thi khác
          </Link>
        </div>

        <style jsx>{`
          .error-container-glass {
            background: white;
            padding: 60px 40px;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            text-align: center;
            max-width: 600px;
            margin: 40px auto;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          }
          .error-icon-box {
            font-size: 64px;
            margin-bottom: 24px;
          }
          .error-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 16px;
          }
          .error-desc {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 30px;
          }
        `}</style>
      </div>
    );

  const start = new Date(contest.ThoiGianBatDau);
  const end = new Date(contest.ThoiGianKetThuc);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  return (
    <div className="contest-page">
      <style dangerouslySetInnerHTML={{ __html: contestStyles }} />
      <ToastContainer />

      <div className="top-nav">
        <Link href="/contests" className="back-link">
          <span className="back-icon">←</span> Quay lại danh sách cuộc thi
        </Link>
      </div>

      <div className="contest-header-compact">
        <div className="header-top">
          <div className="header-info">
            <h1 className="compact-title">{contest.TenCuocThi}</h1>
            <div className="meta-row">
              <StatusBadge status={contest.vnStatus} />
              <span className="creator-label">👤 {contest.taiKhoan.HoTen}</span>
            </div>
          </div>
          <div className="header-actions">
            {!user ? (
              <Link href="/auth/login" className="btn btn-primary">Đăng nhập để tham gia</Link>
            ) : contest.vnStatus === "Sắp mở" ? (
              contest.isUserRegistered ? (
                <button className="btn btn-outline-red" disabled={processing} onClick={() => handleAction("unregister")}>
                  {processing ? "..." : "Hủy đăng ký"}
                </button>
              ) : (
                <button className="btn btn-primary" disabled={processing} onClick={() => handleAction("register")}>
                  {processing ? "..." : "Đăng ký ngay"}
                </button>
              )
            ) : contest.vnStatus === "Đang thi" ? (
              contest.isUserRegistered ? (
                <div className="status-joined">✅ Bạn đang tham gia thi</div>
              ) : (
                <div className="status-locked">🔒 Đã đóng đăng ký</div>
              )
            ) : (
              <div className="status-locked">🏁 Cuộc thi đã {contest.vnStatus.toLowerCase()}</div>
            )}
            
            {(contest.vnStatus === "Đang thi" || contest.vnStatus === "Kết thúc") && (
              <>
                <Link href={`/contests/${params.id}/rank`} className="btn btn-rank">🏆 Xếp hạng</Link>
                <Link href={`/contests/${params.id}/submissions`} className="btn btn-secondary">📊 Bài nộp</Link>
              </>
            )}
          </div>
        </div>
        <div className="header-timeline">
          <span>{start.toLocaleString("vi-VN")}</span>
          <div className="timeline-line"></div>
          <span>{end.toLocaleString("vi-VN")}</span>
        </div>
      </div>

      <div className="contest-body-layout">
        <div className="main-content">
          <div className="content-card">
            <h2 className="section-title">📝 Giới thiệu</h2>
            {/* ĐÃ CẬP NHẬT VIEW MARKDOWN CHUẨN */}
            <div className="markdown-box markdown-body">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
              >
                {contest.MoTa || "_Chưa có mô tả._"}
              </ReactMarkdown>
            </div>
          </div>

          <div className="content-card">
            <h2 className="section-title">📚 Danh sách đề bài</h2>
            <table className="problem-table">
              <thead>
                <tr><th>#</th><th>Đề bài</th><th>Độ khó</th><th>Giới hạn</th></tr>
              </thead>
              <tbody>
                {contest.deBais.map((item: any, index: number) => (
                  <tr key={item.IdDeBai}>
                    <td className="idx">{String.fromCharCode(65 + index)}</td>
                    <td>
                      <Link href={`/contests/${params.id}/${item.IdDeBai}`} className="p-link">
                        {item.TenHienThi || item.deBai?.TieuDe}
                      </Link>
                    </td>
                    <td><DifficultyBadge difficulty={item.deBai?.DoKho} /></td>
                    <td className="specs">{item.deBai?.GioiHanThoiGian}ms / {formatMemory(item.deBai?.GioiHanBoNho)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {contest.ChuY && (
            <div className="content-card warning-card">
              <h2 className="section-title">⚠️ Chú ý từ BTC</h2>
              {/* ĐÃ CẬP NHẬT VIEW MARKDOWN CHUẨN */}
              <div className="markdown-box markdown-body warning-text">
                <ReactMarkdown 
                   remarkPlugins={[remarkGfm, remarkMath]} 
                   rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
                >
                   {contest.ChuY}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="side-card stats-side">
            <h4 className="side-title">📊 Thống kê</h4>
            <div className="stat-item"><span>Số bài tập:</span> <b>{contest.stats.totalProblems}</b></div>
            <div className="stat-item"><span>Thí sinh:</span> <b>{contest.stats.totalRegistrations}</b></div>
            <div className="stat-item"><span>Bài nộp:</span> <b>{contest.stats.totalSubmissions}</b></div>
          </div>

          <div className="side-card info-side">
            <h4 className="side-title">📅 Chi tiết</h4>
            <div className="info-block"><small>Ngày tạo:</small><p>{new Date(contest.NgayTao).toLocaleDateString("vi-VN")}</p></div>
            <div className="info-block"><small>Thời lượng:</small><p>{duration} phút</p></div>
          </div>

          {rankData && rankData.length > 0 && (
            <div className="side-card top-users-side">
              <h4 className="side-title">🏆 Top Thí sinh</h4>
              <div className="top-list">
                {rankData.map((entry: any, index: number) => (
                  <div key={entry.user.IdTaiKhoan} className="top-user-item">
                    <div className={`rank-icon r-${index + 1}`}>{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                    <div className="top-user-info">
                      <p className="top-name">{entry.user.HoTen}</p>
                      <small>{entry.totalPoints} bài • {entry.executionTimes[0] || 0}ms</small>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={`/contests/${params.id}/rank`} className="view-full-rank">Xem bảng xếp hạng ➔</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const contestStyles = `
  .contest-page { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; min-height: 100vh; }
  
  .top-nav { margin-bottom: 20px; }
  .back-link {background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px;
  padding: 2px 6px; text-decoration: none; color: #64748b; 
  font-size: 0.9rem; font-weight: 600; display: flex; 
  align-items: center; gap: 8px; transition: 0.2s; width: fit-content; }
  .back-link:hover { color: #2563eb; transform: translateX(-4px); }
  .back-icon { font-size: 1.2rem; }

  .contest-header-compact { background: #1e293b; color: white; padding: 25px 30px; border-radius: 16px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .compact-title { font-size: 1.8rem; font-weight: 800; margin: 0 0 10px 0; color: #f8fafc; letter-spacing: -0.02em; }
  .meta-row { display: flex; align-items: center; gap: 15px; }
  .creator-label { font-size: 0.85rem; color: #94a3b8; }
  
  .header-timeline { display: flex; align-items: center; gap: 15px; font-size: 0.85rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
  .timeline-line { flex: 1; height: 1px; background: rgba(255,255,255,0.2); position: relative; }
  .timeline-line::after { content: '➔'; position: absolute; right: 0; top: -7px; font-size: 10px; }

  .contest-body-layout { display: grid; grid-template-columns: 1fr 280px; gap: 25px; align-items: start; }
  .content-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .warning-card { background: #fffbeb; border-color: #fef3c7; }
  .section-title { font-size: 1.1rem; margin-bottom: 20px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }

  .problem-table { width: 100%; border-collapse: collapse; }
  .problem-table th { text-align: left; padding: 12px; font-size: 0.8rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
  .problem-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; }
  .idx { font-weight: 900; color: #2563eb; font-size: 1.2rem; width: 40px; }
  .p-link { text-decoration: none; color: #1e293b; font-weight: 700; font-size: 1rem; transition: 0.2s; }
  .p-link:hover { color: #2563eb; }
  .specs { font-size: 0.85rem; color: #64748b; font-family: monospace; }

  .header-actions { display: flex; gap: 12px; align-items: center; }
  .btn { padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; border: none; transition: 0.2s; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
  .btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 10px rgba(37,99,235,0.2); }
  .btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); }
  .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
  .btn-secondary:hover { background: rgba(255,255,255,0.2); }
  .btn-rank { background: #f59e0b; color: white; }
  .btn-rank:hover { background: #d97706; transform: translateY(-2px); }
  .btn-outline-red { background: white; color: #ef4444; border: 1.5px solid #ef4444; }
  .btn-outline-red:hover { background: #fef2f2; }
  
  .status-joined { background: #dcfce7; color: #15803d; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; }
  .status-locked { background: #f1f5f9; color: #64748b; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; border: 1px solid #e2e8f0; }

  .side-card { background: white; padding: 22px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
  .side-title { margin: 0 0 18px 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 800; }
  .stat-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #f1f5f9; font-size: 0.9rem; }
  .info-block small { color: #94a3b8; text-transform: uppercase; font-size: 0.7rem; font-weight: 700; }
  .info-block p { margin: 4px 0 15px 0; font-weight: 700; color: #1e293b; }

  /* Markdown View Sync */
  .markdown-body { line-height: 1.6; font-size: 15px; color: #334155; }
  .markdown-body table { border-collapse: collapse; width: 100%; margin: 15px 0; border: 1px solid #e2e8f0; }
  .markdown-body th, .markdown-body td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
  .markdown-body th { background: #f8fafc; font-weight: 700; }
  .markdown-body code { background: #f1f5f9; color: #e11d48; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 13px; }
  .markdown-body pre {background: #f6f6f6ff; ;color: #000000ff; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 15px 0; }
  .markdown-body pre code { background: transparent; color: inherit; padding: 0; }
  .warning-text { color: #9a3412; }

  .top-users-side { border: 1px solid #e0e7ff; background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%); }
  .top-user-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .top-user-item:last-child { border-bottom: none; }
  .rank-icon { font-size: 1.3rem; min-width: 30px; }
  .top-name { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.95rem; }
  .top-user-info small { color: #64748b; font-size: 0.75rem; }
  .view-full-rank { display: block; margin-top: 15px; font-size: 0.85rem; font-weight: 700; color: #2563eb; text-decoration: none; text-align: center; transition: 0.2s; }
  .view-full-rank:hover { letter-spacing: 0.5px; }

  .loading-state { text-align: center; padding: 100px; color: #64748b; font-weight: 600; }

  @media (max-width: 900px) {
    .contest-body-layout { grid-template-columns: 1fr; }
    .header-top { flex-direction: column; gap: 20px; }
    .header-actions { width: 100%; flex-wrap: wrap; }
    .btn { flex: 1; }
  }
`;