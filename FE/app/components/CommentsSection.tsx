"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Comment {
  IdBinhLuan: string;
  IdDeBai: string;
  IdTaiKhoan: string;
  IdBinhLuanCha?: string | null;
  NoiDung: string;
  NgayTao: string;
  taiKhoan: {
    IdTaiKhoan: string;
    TenDangNhap: string;
    HoTen: string;
    Email: string;
  } | null;
  replies?: Comment[];
  parentUser?: {
    IdTaiKhoan: string;
    TenDangNhap: string;
    HoTen: string;
  } | null;
}

interface CommentsSectionProps {
  problemId: string;
  user: any | null;
}

export default function CommentsSection({ problemId, user }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    if (!problemId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/comments?problemId=${problemId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!newComment.trim()) {
      setError("Vui lòng nhập nội dung bình luận");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdDeBai: problemId,
          IdTaiKhoan: user.IdTaiKhoan,
          NoiDung: newComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Không thể đăng bình luận");
      }

      await fetchComments();
      setNewComment("");
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Vui lòng đăng nhập để trả lời");
      return;
    }

    if (!replyContent.trim()) {
      setError("Vui lòng nhập nội dung trả lời");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdDeBai: problemId,
          IdTaiKhoan: user.IdTaiKhoan,
          IdBinhLuanCha: parentId,
          NoiDung: replyContent.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Không thể đăng trả lời");
      }

      await fetchComments();
      setReplyContent("");
      setReplyingTo(null);
      // Expand parent comment khi reply
      setCollapsedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(parentId);
        return newSet;
      });
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCollapse = (commentId: string) => {
    setCollapsedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const countAllReplies = (comment: Comment): number => {
    if (!comment.replies || comment.replies.length === 0) return 0;
    return comment.replies.reduce((sum, reply) => {
      return sum + 1 + countAllReplies(reply);
    }, 0);
  };

  const totalComments = comments.reduce((sum, c) => sum + 1 + countAllReplies(c), 0);

  if (loading) {
    return (
      <div className="form-card">
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", marginTop: 0 }}>
          Bình luận
        </h2>
        <div className="loading">Đang tải bình luận...</div>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", marginTop: 0 }}>
        💬 Bình luận ({totalComments})
      </h2>

      {/* Comment form */}
      {user ? (
        <div
          style={{
            padding: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "8px",
            marginBottom: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "10px" }}>
              <textarea
                className="textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận của bạn... (Hỗ trợ Markdown)"
                rows={4}
                style={{
                  fontFamily: "inherit",
                  fontSize: "14px",
                  background: "white",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: "6px",
                  padding: "10px",
                  width: "100%",
                  resize: "vertical",
                }}
              />
            </div>
            {error && !replyingTo && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.9)",
                  color: "#c62828",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              className="button"
              disabled={submitting || !newComment.trim()}
              style={{
                background: "white",
                color: "#667eea",
                fontWeight: 600,
                padding: "10px 24px",
                border: "none",
                borderRadius: "6px",
                cursor: submitting || !newComment.trim() ? "not-allowed" : "pointer",
                opacity: submitting || !newComment.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? "Đang đăng..." : "📝 Đăng bình luận"}
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            padding: "16px",
            background: "#fff3cd",
            borderRadius: "8px",
            marginBottom: "24px",
            border: "1px solid #ffc107",
          }}
        >
          💡 <Link href="/auth/login" className="problem-link" style={{ fontWeight: 600 }}>
            Đăng nhập
          </Link>{" "}
          để bình luận
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>💬</div>
          <p style={{ fontSize: "16px", margin: 0 }}>
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.IdBinhLuan}
              comment={comment}
              user={user}
              problemId={problemId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleReply={handleReply}
              error={error}
              submitting={submitting}
              collapsedComments={collapsedComments}
              toggleCollapse={toggleCollapse}
              level={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  user: any | null;
  problemId: string | undefined;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleReply: (parentId: string, e: React.FormEvent) => void;
  error: string | null;
  submitting: boolean;
  collapsedComments: Set<string>;
  toggleCollapse: (id: string) => void;
  level: number;
  isLastReply?: boolean; // Đánh dấu reply cuối cùng trong danh sách
}

function CommentItem({
  comment,
  user,
  problemId,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  handleReply,
  error,
  submitting,
  collapsedComments,
  toggleCollapse,
  level,
  isLastReply = false,
}: CommentItemProps) {
  const isCollapsed = collapsedComments.has(comment.IdBinhLuan);
  const replyCount = comment.replies?.length || 0;
  const isReply = level > 0;
  const hasReplies = replyCount > 0 && !isCollapsed;
  
  // Đường kẻ dọc chỉ kéo dài xuống nếu:
  // 1. Comment có replies và không bị collapse, VÀ
  // 2. Không phải là reply cuối cùng (hoặc có replies của chính nó)
  const shouldExtendLine = hasReplies || (isReply && !isLastReply);
  
  // Ensure problemId is always a string
  const safeProblemId = problemId || "";

  return (
    <div
      style={{
        position: "relative",
        paddingLeft: level > 0 ? "32px" : "0",
        marginBottom: "8px",
      }}
    >
      {/* Tree connector lines - chỉ hiển thị nếu là reply */}
      {level > 0 && (
        <>
          {/* Đường kẻ dọc - chỉ kéo dài xuống nếu có replies hoặc không phải reply cuối cùng */}
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "0",
              bottom: shouldExtendLine ? "0" : "16px",
              width: "2px",
              background: "#d0d0d0",
            }}
          />
          {/* Đường kẻ ngang - nối từ đường dọc đến comment */}
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "16px",
              width: "16px",
              height: "2px",
              background: "#d0d0d0",
            }}
          />
        </>
      )}
      
      <div
        style={{
          padding: "12px 16px",
          background: isReply ? "#f8f9fa" : "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          boxShadow: isReply ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
      {/* Comment header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div
                  style={{
                    width: isReply ? "32px" : "40px",
                    height: isReply ? "32px" : "40px",
                    borderRadius: "50%",
                    background: isReply
                      ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: isReply ? "13px" : "16px",
                  }}
                >
                  {comment.taiKhoan?.HoTen?.[0]?.toUpperCase() || "U"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {comment.taiKhoan ? (
                      <>
                        <Link
                          href={`/users/${comment.taiKhoan.IdTaiKhoan}`}
                          className="problem-link"
                          style={{
                            fontWeight: 600,
                            fontSize: isReply ? "14px" : "15px",
                            color: isReply ? "#f5576c" : "#667eea",
                          }}
                        >
                          {comment.taiKhoan.HoTen}
                        </Link>
                        {comment.parentUser && (
                          <>
                            <span style={{ color: "#999", fontSize: "12px" }}>→</span>
                            <Link
                              href={`/users/${comment.parentUser.IdTaiKhoan}`}
                              className="problem-link"
                              style={{ fontSize: "13px", color: "#666" }}
                            >
                              {comment.parentUser.HoTen}
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: isReply ? "14px" : "15px" }}>
                        User {comment.IdTaiKhoan}
                      </span>
                    )}
                  </div>
            <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
              {new Date(comment.NgayTao).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {replyCount > 0 && (
            <button
              onClick={() => toggleCollapse(comment.IdBinhLuan)}
              style={{
                padding: "4px 8px",
                background: "transparent",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                color: "#666",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title={isCollapsed ? "Hiện replies" : "Ẩn replies"}
            >
              {isCollapsed ? "▶" : "▼"} {replyCount}
            </button>
          )}
          {user && (
            <button
              onClick={() => {
                if (replyingTo === comment.IdBinhLuan) {
                  setReplyingTo(null);
                  setReplyContent("");
                } else {
                  setReplyingTo(comment.IdBinhLuan);
                  setReplyContent("");
                }
              }}
              style={{
                padding: "6px 12px",
                background: replyingTo === comment.IdBinhLuan ? "#667eea" : "#f0f0f0",
                color: replyingTo === comment.IdBinhLuan ? "white" : "#666",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {replyingTo === comment.IdBinhLuan ? "✕ Hủy" : "↩ Trả lời"}
            </button>
          )}
        </div>
      </div>

      {/* Comment content */}
      <div
        style={{
          fontSize: isReply ? "13px" : "14px",
          lineHeight: "1.6",
          color: "#333",
          marginBottom: "8px",
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {comment.NoiDung}
        </ReactMarkdown>
      </div>

      {/* Reply form */}
      {replyingTo === comment.IdBinhLuan && user && (
        <form
          onSubmit={(e) => handleReply(comment.IdBinhLuan, e)}
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e0e0e0",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <textarea
              className="textarea"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Trả lời ${comment.taiKhoan?.HoTen || "người dùng"}...`}
              rows={2}
              style={{
                fontFamily: "inherit",
                fontSize: "13px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "8px",
                width: "100%",
                resize: "vertical",
              }}
            />
          </div>
          {error && replyingTo === comment.IdBinhLuan && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                background: "#ffebee",
                color: "#c62828",
                fontSize: "13px",
                marginBottom: "10px",
              }}
            >
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              className="button"
              disabled={submitting || !replyContent.trim()}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: submitting || !replyContent.trim() ? "not-allowed" : "pointer",
                opacity: submitting || !replyContent.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? "Đang gửi..." : "Gửi trả lời"}
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "#e0e0e0",
                color: "#666",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      </div>
      
      {/* Replies - chỉ hiển thị nếu không bị collapse */}
      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {comment.replies.map((reply, index) => (
            <CommentItem
              key={reply.IdBinhLuan}
              comment={reply}
              user={user}
              problemId={safeProblemId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleReply={handleReply}
              error={error}
              submitting={submitting}
              collapsedComments={collapsedComments}
              toggleCollapse={toggleCollapse}
              level={level + 1}
              isLastReply={index === comment.replies!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
