import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function fetchContest(id: string) {
  const res = await fetch(`${API_BASE}/api/contests`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách cuộc thi");
  const contests = await res.json();
  const contest = contests.find((c: any) => c.IdCuocThi.toString() === id);
  if (!contest) throw new Error("Không tìm thấy cuộc thi");
  return contest;
}

export default async function ContestDetailPage({ params }: { params: { id: string } }) {
  let contest: any = null;
  let error: string | null = null;

  try {
    contest = await fetchContest(params.id);
  } catch (e: any) {
    error = e.message;
  }

  if (error) {
    return (
      <div>
        <h1 className="section-title">Contest Detail</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  const start = new Date(contest.ThoiGianBatDau);
  const end = new Date(contest.ThoiGianKetThuc);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="section-title">{contest?.TenCuocThi || `Contest ${params.id}`}</h1>
        <p className="section-sub">
          Bắt đầu: {start.toLocaleString("vi-VN")} • Kết thúc:{" "}
          {end.toLocaleString("vi-VN")}
        </p>
      </div>

      <div className="form-card">
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Mô tả cuộc thi</h2>
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {contest?.MoTa || "Chưa có mô tả."}
          </ReactMarkdown>
        </article>
      </div>

      <div className="form-card" style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Danh sách đề bài</h2>
        {contest.deBais?.length ? (
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "60%" }}>Đề bài</th>
                  <th style={{ width: "40%" }}>Tên hiển thị</th>
                </tr>
              </thead>
              <tbody>
                {contest.deBais.map((item: any) => (
                  <tr key={item.IdDeBai}>
                    <td>
                      <a href={`/problems/${item.IdDeBai}`} className="problem-link">
                        {item.deBai?.TieuDe || `Problem ${item.IdDeBai}`}
                      </a>
                    </td>
                    <td>{item.TenHienThi || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#666" }}>Chưa có đề bài nào trong cuộc thi này.</p>
        )}
      </div>
    </div>
  );
}


