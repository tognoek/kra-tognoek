import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

interface Props {
  params: Promise<{ id: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function fetchProblem(id: string) {
  const url = `${API_BASE}/api/problems/${id}`;
  
  console.log("Fetching:", url);

  const res = await fetch(url, { 
    cache: "no-store"
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.error || `Lỗi tải đề (Mã lỗi: ${res.status})`;
    throw new Error(message);
  }

  const problem = await res.json();
  
  return problem;
}

export default async function ProblemDetailPage(props: Props) {
  let problem: any = null;
  let error: string | null = null;

  try {
    const params = await props.params;
    
    const id = params.id;

    problem = await fetchProblem(id);
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

