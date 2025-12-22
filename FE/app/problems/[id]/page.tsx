import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function fetchProblem(id: string) {
  const res = await fetch(`${API_BASE}/api/problems`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được đề bài");
  const problems = await res.json();
  const problem = problems.find((p: any) => p.IdDeBai.toString() === id);
  if (!problem) throw new Error("Không tìm thấy đề bài");
  return problem;
}

export default async function ProblemDetailPage({ params }: { params: { id: string } }) {
  let problem: any = null;
  let error: string | null = null;

  try {
    problem = await fetchProblem(params.id);
  } catch (e: any) {
    error = e.message;
  }

  if (error) {
    return (
      <div>
        <h1 className="section-title">Problem Detail</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="section-title">{problem?.TieuDe || `Problem ${params.id}`}</h1>
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          <span className="difficulty difficulty-medium">
            Difficulty: {problem?.DoKho || "N/A"}
          </span>
          <span style={{ color: "#666" }}>
            Time Limit: {problem?.GioiHanThoiGian ? `${problem.GioiHanThoiGian}ms` : "N/A"}
          </span>
          <span style={{ color: "#666" }}>
            Memory Limit: {problem?.GioiHanBoNho ? `${problem.GioiHanBoNho}KB` : "N/A"}
          </span>
        </div>
      </div>

      <div className="form-card">
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Problem Statement</h2>
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {problem?.NoiDungDeBai || "Nội dung đề bài chưa có."}
          </ReactMarkdown>
        </article>
      </div>

      <div className="form-card" style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Submit Solution</h2>
        <p style={{ color: "#666", marginBottom: "16px" }}>
          Để nộp bài, vui lòng truy cập trang{" "}
          <a href="/submissions" style={{ color: "#1a73e8", fontWeight: 600 }}>
            Submissions
          </a>
          .
        </p>
      </div>
    </div>
  );
}

