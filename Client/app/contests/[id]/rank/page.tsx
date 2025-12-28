"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export default function ContestRankPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;

    fetch(`${API_BASE}/api/ranks/${contestId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải bảng xếp hạng");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [contestId]);

  if (loading) return (
    <div className="status-container">
      <div className="loader"></div>
      <p>Đang tổng hợp thứ hạng...</p>
      <style dangerouslySetInnerHTML={{ __html: loaderStyles }} />
    </div>
  );

  if (error) return (
    <div className="status-container">
      <div className="error-icon">⚠️</div>
      <p>Lỗi: {error}</p>
      <Link href="/contests" className="btn-back-home">Quay lại danh sách</Link>
      <style dangerouslySetInnerHTML={{ __html: loaderStyles }} />
    </div>
  );

  return (
    <div className="rank-wrapper">
      <style dangerouslySetInnerHTML={{ __html: modernRankStyles }} />
      
      <div className="rank-top-bar">
        <Link href={`/contests/${contestId}`} className="modern-btn-back">
          <span className="icon">‹</span>
          <span className="text">Quay lại cuộc thi</span>
        </Link>
        <div className="contest-meta">
          <h1 className="main-title">{data?.contestName}</h1>
        </div>
        <div className="stats-quick-view">
          <div className="stat-item">
          </div>
        </div>
      </div>

      <div className="table-container-glass">
        <table className="modern-rank-table">
          <thead>
            <tr>
              <th className="w-rank text-center">#</th>
              <th className="w-user">Thí sinh</th>
              <th className="w-points text-center">Tổng điểm</th>
              {data?.problems.map((p: any, idx: number) => (
                <th key={p.IdDeBai} title={p.Ten} className="text-center prob-header">
                  <Link href={`/contests/${contestId}/${p.IdDeBai}`}>
                    <div className="prob-id clickable-prob">
                      {String.fromCharCode(65 + idx)}
                    </div>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.leaderboard.map((row: any, index: number) => {
              const rank = index + 1;
              const rankClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
              const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;

              return (
                <tr key={row.user.IdTaiKhoan} className={`rank-row ${rankClass}`}>
                  <td className="rank-col text-center">
                    <span className={`rank-badge ${rankClass}`}>{medal}</span>
                  </td>
                  <td className="user-col">
                    <div className="user-info">
                      <div className={`avatar-mini avatar-${rankClass || 'default'}`}>
                        {row.user.HoTen.charAt(0)}
                      </div>
                      <div className="name-group">
                        <div className="full-name">{row.user.HoTen}</div>
                      </div>
                    </div>
                  </td>
                  <td className="points-col text-center">
                    <span className={`score-text text-${rankClass || 'blue'}`}>{row.totalPoints}</span>
                  </td>
                  {row.problemStats.map((prob: any) => (
                    <td key={prob.IdDeBai} className="text-center">
                      {prob.attempts > 0 ? (
                        <div className={`prob-result-box ${prob.isSolved ? "is-ac" : "is-wa"}`}>
                          <div className="attempts-count">{prob.isSolved ? "✔" : "✘"} {prob.attempts}</div>
                          <div className="submit-time">
                            {prob.lastSubmitTime ? new Date(prob.lastSubmitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="no-submit">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const modernRankStyles = `
  .rank-wrapper { max-width: 1200px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; }
  
  .modern-btn-back { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #475569; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.2s ease; }
  .modern-btn-back:hover { border-color: #cbd5e1; background: #f8fafc; transform: translateX(-4px); }

  .rank-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
  .contest-meta { text-align: center; }
  .contest-badge-top { background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 8px; }
  .main-title { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -1px; }
  
  .stats-quick-view { display: flex; gap: 20px; }
  .stat-item { text-align: right; }
  .stat-item .val { display: block; font-size: 24px; font-weight: 800; color: #0f172a; }
  .stat-item .lbl { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }

  .table-container-glass { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.04); }
  .modern-rank-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
  
  /* Reset alignment for all headers and then specify user header */
  .modern-rank-table th { 
    background: #f8fafc; 
    padding: 20px 15px; 
    font-size: 12px; 
    color: #64748b; 
    text-transform: uppercase; 
    font-weight: 700; 
    border-bottom: 2px solid #f1f5f9;
    text-align: center; 
  }
  .modern-rank-table th.w-user { text-align: left; }

  /* Table Body Alignment */
  .modern-rank-table td { padding: 16px 15px; border-bottom: 1px solid #f1f5f9; transition: all 0.2s; text-align: center; }
  .modern-rank-table td.user-col { text-align: left; }

  .rank-row.gold { background: linear-gradient(90deg, #fffbeb 0%, #fff 15%); }
  .rank-row.silver { background: linear-gradient(90deg, #f8fafc 0%, #fff 15%); }
  .rank-row.bronze { background: linear-gradient(90deg, #fff7ed 0%, #fff 15%); }
  .rank-row:hover td { background: #f1f5f9 !important; }

  .rank-badge { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: 800; font-size: 15px; background: #f1f5f9; color: #64748b; }
  .rank-badge.gold { background: #fef3c7; color: #92400e; font-size: 20px; box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.3); }
  .rank-badge.silver { background: #e2e8f0; color: #475569; font-size: 20px; }
  .rank-badge.bronze { background: #ffedd5; color: #9a3412; font-size: 20px; }

  .avatar-mini { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; background: #64748b; flex-shrink: 0; }
  .avatar-gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
  .avatar-silver { background: linear-gradient(135deg, #94a3b8, #64748b); }
  .avatar-bronze { background: linear-gradient(135deg, #d97706, #b45309); }

  .user-info { display: flex; align-items: center; gap: 12px; }
  .full-name { font-weight: 700; color: #1e293b; font-size: 15px; }
  .user-handle { font-size: 12px; color: #94a3b8; }

  .score-text { font-size: 20px; font-weight: 900; }
  .text-gold { color: #b45309; }
  .text-silver { color: #475569; }
  .text-bronze { color: #9a3412; }
  .text-blue { color: #2563eb; }

  .prob-result-box { padding: 8px; border-radius: 10px; min-height: 45px; display: flex; flex-direction: column; justify-content: center; transition: transform 0.1s; margin: 0 auto; width: fit-content; min-width: 60px; }
  .prob-result-box:hover { transform: scale(1.05); }
  .is-ac { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .is-wa { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
  .attempts-count { font-weight: 800; font-size: 13px; }
  .submit-time { font-size: 10px; opacity: 0.7; font-weight: 600; }
  .no-submit { color: #cbd5e1; }

  .prob-id { background: #f1f5f9; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; margin: 0 auto; color: #475569; font-size: 14px; font-weight: 700; }
  .clickable-prob { cursor: pointer; transition: all 0.2s ease; }
  .clickable-prob:hover { background: #2563eb; color: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
  
  .text-center { text-align: center !important; }
`;

const loaderStyles = `
  .status-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; font-family: 'Inter', sans-serif; }
  .loader { width: 48px; height: 48px; border: 5px solid #e2e8f0; border-bottom-color: #2563eb; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; margin-bottom: 20px; }
  @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .error-icon { font-size: 48px; margin-bottom: 20px; }
  .btn-back-home { margin-top: 20px; color: #2563eb; text-decoration: none; font-weight: 600; }
`;