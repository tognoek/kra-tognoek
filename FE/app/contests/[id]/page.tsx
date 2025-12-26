"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import StatusBadge from "../../components/StatusBadge";
import DifficultyBadge from "../../components/DifficultyBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface ContestDetail {
  IdCuocThi: string;
  IdTaiKhoan: string;
  TenCuocThi: string;
  MoTa: string;
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  TrangThai: boolean;
  NgayTao: string;
  ChuY?: string;
  Status: string;
  taiKhoan: {
    IdTaiKhoan: string;
    TenDangNhap: string;
    HoTen: string;
    Email: string;
  };
  deBais: Array<{
    IdCuocThi: string;
    IdDeBai: string;
    TenHienThi?: string;
    deBai: {
      IdDeBai: string;
      TieuDe: string;
      DoKho: string;
      GioiHanThoiGian: number;
      GioiHanBoNho: number;
    } | null;
  }>;
  dangKys: Array<{
    IdCuocThi: string;
    IdTaiKhoan: string;
    TrangThai: boolean;
    taiKhoan: {
      IdTaiKhoan: string;
      TenDangNhap: string;
      HoTen: string;
    };
  }>;
  stats: {
    totalProblems: number;
    totalRegistrations: number;
    totalSubmissions: number;
  };
}

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/contests/${params.id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Cuộc thi không tồn tại");
          }
          throw new Error("Không tải được thông tin cuộc thi");
        }

        const data = await res.json();
        setContest(data);

        // Update page title
        if (typeof document !== "undefined") {
          document.title = `${
            data.TenCuocThi || `Cuộc thi ${params.id}`
          } - OJ Portal`;
        }
      } catch (e: any) {
        setError(e.message);
        if (typeof document !== "undefined") {
          document.title = "Chi tiết cuộc thi - OJ Portal";
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchContest();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <h1 className="section-title">Chi tiết cuộc thi</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div>
        <h1 className="section-title">Chi tiết cuộc thi</h1>
        <p style={{ color: "red" }}>{error || "Không tìm thấy cuộc thi"}</p>
        <Link
          href="/contests"
          className="button"
          style={{ marginTop: "16px", display: "inline-block" }}
        >
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const start = new Date(contest.ThoiGianBatDau);
  const end = new Date(contest.ThoiGianKetThuc);
  const now = new Date();
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 className="section-title">{contest.TenCuocThi}</h1>
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "8px",
          }}
        >
          <StatusBadge status={contest.Status} />
          <span style={{ color: "#666", fontSize: "14px" }}>
            Bắt đầu: {start.toLocaleString("vi-VN")}
          </span>
          <span style={{ color: "#666", fontSize: "14px" }}>
            Kết thúc: {end.toLocaleString("vi-VN")}
          </span>
          <span style={{ color: "#666", fontSize: "14px" }}>
            Thời lượng: {duration} phút
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card">
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Số đề bài
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#667eea" }}>
            {contest.stats.totalProblems}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Số người đăng ký
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#764ba2" }}>
            {contest.stats.totalRegistrations}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Tổng số bài nộp
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#48bb78" }}>
            {contest.stats.totalSubmissions}
          </div>
        </div>
      </div>

      {/* Contest Info */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "16px",
            marginTop: 0,
          }}
        >
          Thông tin cuộc thi
        </h2>
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <strong>Người tạo:</strong>{" "}
            <Link
              href={`/users/${contest.taiKhoan.IdTaiKhoan}`}
              className="problem-link"
            >
              {contest.taiKhoan.HoTen} (@{contest.taiKhoan.TenDangNhap})
            </Link>
          </div>
          <div>
            <strong>Ngày tạo:</strong>{" "}
            {new Date(contest.NgayTao).toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="form-card" style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "16px",
            marginTop: 0,
          }}
        >
          Mô tả cuộc thi
        </h2>
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {contest.MoTa || "Chưa có mô tả."}
          </ReactMarkdown>
        </article>
      </div>

      {contest.ChuY && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            background: "#fff3cd",
            borderRadius: "4px",
            border: "1px solid #ffc107",
          }}
        >
          <strong style={{ color: "#856404" }}>⚠️ Chú ý:</strong>
          <div style={{ color: "#856404", marginTop: "4px" }}>
            {contest.ChuY}
          </div>
        </div>
      )}
      {/* Problems List */}
      <div className="form-card" style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "16px",
            marginTop: 0,
          }}
        >
          Danh sách đề bài ({contest.deBais.length})
        </h2>
        {contest.deBais.length > 0 ? (
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "10%", whiteSpace: "nowrap" }}>#</th>
                  <th style={{ width: "40%", whiteSpace: "nowrap" }}>Đề bài</th>
                  <th style={{ width: "15%", whiteSpace: "nowrap" }}>Độ khó</th>
                  <th style={{ width: "15%", whiteSpace: "nowrap" }}>
                    Thời gian
                  </th>
                  <th style={{ width: "15%", whiteSpace: "nowrap" }}>Bộ nhớ</th>
                  <th style={{ width: "5%", whiteSpace: "nowrap" }}></th>
                </tr>
              </thead>
              <tbody>
                {contest.deBais.map((item, index) => (
                  <tr key={item.IdDeBai}>
                    <td style={{ fontWeight: 600, color: "#667eea" }}>
                      {String.fromCharCode(65 + index)} {/* A, B, C, ... */}
                    </td>
                    <td>
                      {item.deBai ? (
                        <Link
                          href={`/problems/${item.deBai.IdDeBai}`}
                          className="problem-link"
                        >
                          {item.TenHienThi || item.deBai.TieuDe}
                        </Link>
                      ) : (
                        <span style={{ color: "#999" }}>Đề bài đã bị xóa</span>
                      )}
                    </td>
                    <td>
                      {item.deBai ? (
                        <DifficultyBadge difficulty={item.deBai.DoKho} />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {item.deBai ? `${item.deBai.GioiHanThoiGian}ms` : "-"}
                    </td>
                    <td>
                      {item.deBai
                        ? `${Math.round(item.deBai.GioiHanBoNho / 1024)}MB`
                        : "-"}
                    </td>
                    <td>
                      {item.deBai && (
                        <Link
                          href={`/problems/${item.deBai.IdDeBai}`}
                          className="button"
                          style={{ padding: "4px 12px", fontSize: "12px" }}
                        >
                          Xem
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#666" }}>
            Chưa có đề bài nào trong cuộc thi này.
          </p>
        )}
      </div>

      {/* Registered Users */}
      {contest.dangKys.length > 0 && (
        <div className="form-card">
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "16px",
              marginTop: 0,
            }}
          >
            Danh sách người đăng ký ({contest.dangKys.length})
          </h2>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "10%", whiteSpace: "nowrap" }}>#</th>
                  <th style={{ width: "30%", whiteSpace: "nowrap" }}>
                    Tên đăng nhập
                  </th>
                  <th style={{ width: "40%", whiteSpace: "nowrap" }}>Họ tên</th>
                  <th style={{ width: "20%", whiteSpace: "nowrap" }}>
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {contest.dangKys.map((dangKy, index) => (
                  <tr key={dangKy.IdTaiKhoan}>
                    <td>{index + 1}</td>
                    <td>
                      <Link
                        href={`/users/${dangKy.taiKhoan.IdTaiKhoan}`}
                        className="problem-link"
                      >
                        {dangKy.taiKhoan.TenDangNhap}
                      </Link>
                    </td>
                    <td>{dangKy.taiKhoan.HoTen}</td>
                    <td>
                      <StatusBadge
                        status={
                          dangKy.TrangThai ? "Hoạt động" : "Không hoạt động"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
