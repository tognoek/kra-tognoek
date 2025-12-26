"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  const problemId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;
      
      try {
        const res = await fetch(`${API_BASE}/api/problems/${problemId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody.error || `Lỗi tải đề (Mã lỗi: ${res.status})`);
        }

        const data = await res.json();
        setProblem(data);
        
        // Update page title
        if (typeof document !== "undefined") {
          document.title = `${data.TieuDe || `Đề bài ${problemId}`} - OJ Portal`;
        }
      } catch (e: any) {
        setError(e.message);
        if (typeof document !== "undefined") {
          document.title = "Chi tiết đề bài - OJ Portal";
        }
      } finally {
        setLoading(false);
      }
    };

    // Check if user is logged in
    if (typeof window !== "undefined") {
      const userStr = window.localStorage.getItem("oj_user");
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
    }

    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  if (loading) {
    return (
      <div>
        <h1 className="section-title">Chi tiết đề bài</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div>
        <h1 className="section-title">Chi tiết đề bài</h1>
        <p style={{ color: "red" }}>{error || "Không tìm thấy đề bài"}</p>
        <Link href="/problems" className="button" style={{ marginTop: "16px", display: "inline-block" }}>
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <h1 className="section-title">{problem.TieuDe || `Đề bài ${problemId}`}</h1>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <span className="difficulty difficulty-medium">
                Độ khó: {problem.DoKho || "N/A"}
              </span>
              <span style={{ color: "#666" }}>
                Giới hạn thời gian: {problem.GioiHanThoiGian ? `${problem.GioiHanThoiGian}ms` : "N/A"}
              </span>
              <span style={{ color: "#666" }}>
                Giới hạn bộ nhớ: {problem.GioiHanBoNho ? `${Math.round(problem.GioiHanBoNho / 1024)}MB` : "N/A"}
              </span>
              {problem.taiKhoan && (
                <span style={{ color: "#666" }}>
                  Người tạo:{" "}
                  <Link href={`/users/${problem.taiKhoan.IdTaiKhoan}`} className="problem-link">
                    {problem.taiKhoan.TenDangNhap}
                  </Link>
                </span>
              )}
            </div>
          </div>
          {user && (
            <button
              className="button"
              onClick={() => setShowSubmitModal(true)}
              style={{ marginLeft: "16px" }}
            >
              📤 Nộp bài
            </button>
          )}
        </div>
        {!user && (
          <div style={{ padding: "12px", background: "#fff3cd", borderRadius: "4px", marginTop: "12px" }}>
            💡 <Link href="/auth/login" className="problem-link">Đăng nhập</Link> để nộp bài
          </div>
        )}
      </div>

      <div className="form-card">
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", marginTop: 0 }}>
          Đề bài
        </h2>
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {problem.NoiDungDeBai || "Nội dung đề bài chưa có."}
          </ReactMarkdown>
        </article>
      </div>

      {/* Comments Section */}
      {problemId && (
        <div style={{ marginTop: "24px" }}>
          <CommentsSection problemId={problemId} user={user} />
        </div>
      )}

      <SubmitModal
        open={showSubmitModal}
        problemId={problemId || ""}
        problemTitle={problem.TieuDe}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          // Refresh submissions or redirect
          if (typeof window !== "undefined") {
            window.location.href = "/submissions";
          }
        }}
      />
    </div>
  );
}
