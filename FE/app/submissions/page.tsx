"use client";

import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function fetchSubmissions() {
  const res = await fetch(`${API_BASE}/api/submissions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách bài nộp");
  return res.json();
}

export default function SubmissionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  // Format status display
  const getStatusDisplay = (status: string | null) => {
    if (!status || status === "null") {
      return (
        <span style={{ color: "#ff9800", fontWeight: 600 }}>
          ⏳ Đang chấm...
        </span>
      );
    }

    if (status.startsWith("wrong_answer:")) {
      const match = status.match(/wrong_answer:(\d+)\/(\d+)/);
      if (match) {
        const testNum = match[1];
        const totalTests = match[2];
        return (
          <span style={{ color: "#c62828", fontWeight: 600 }}>
            ❌ Sai ở test {testNum} / {totalTests}
          </span>
        );
      }
    }

    if (status === "accepted") {
      return (
        <span style={{ color: "#2e7d32", fontWeight: 600 }}>
          ✅ Hoàn tất
        </span>
      );
    }

    if (status.startsWith("memory_limit_exceeded:")) {
      const match = status.match(/memory_limit_exceeded:(\d+)\/(\d+)/);
      if (match) {
        const testNum = match[1];
        const totalTests = match[2];
        return (
          <span style={{ color: "#c62828", fontWeight: 600 }}>
            ❌ Quá bộ nhớ {testNum} / {totalTests}
          </span>
        );
      }
    }

    if (status.startsWith("time_limit_exceeded:")) {
      const match = status.match(/time_limit_exceeded:(\d+)\/(\d+)/);
      if (match) {
        const testNum = match[1];
        const totalTests = match[2];
        return (
          <span style={{ color: "#c62828", fontWeight: 600 }}>
            ❌ Quá thời gian {testNum} / {totalTests}
          </span>
        );
      }
    }

    if (status.startsWith("compile_error")) {
      return (
        <span style={{ color: "#c62828", fontWeight: 600 }}>
          ❌ Lỗi biên dịch
        </span>
      );
    }
    return <StatusBadge status={status} />;
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Danh sách bài nộp - OJ Portal";
    }
    
    loadSubmissions();
    const interval = setInterval(loadSubmissions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSubmissions = () => {
    fetchSubmissions()
      .then((d) => {
        setData(d);
        setFiltered(d);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const username = s.taiKhoan?.TenDangNhap || s.taiKhoan?.TenTaiKhoan || "";
        return (
          s.IdBaiNop?.toString().includes(query) ||
          s.deBai?.TieuDe?.toLowerCase().includes(query) ||
          username.toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (filterStatus === "pending") {
      result = result.filter((s) => !s.TrangThaiCham || s.TrangThaiCham === "null" || s.TrangThaiCham === "pending");
    } else if (filterStatus === "accepted") {
      result = result.filter((s) => s.TrangThaiCham === "accepted" || s.TrangThaiCham === "AC");
    } else if (filterStatus === "rejected") {
      result = result.filter(
        (s) =>
          s.TrangThaiCham &&
          s.TrangThaiCham !== "null" &&
          s.TrangThaiCham !== "accepted" &&
          s.TrangThaiCham !== "AC" &&
          s.TrangThaiCham !== "pending"
      );
    }

    setFiltered(result);
  }, [data, searchQuery, filterStatus]);

  if (loading && data.length === 0) {
    return (
      <div>
        <h1 className="section-title">Bài nộp</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className="section-title">Bài nộp</h1>
          <p className="section-sub">Nộp bài và xem kết quả chấm</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm theo ID, tên bài, hoặc user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="filter-group">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Đang chấm
          </button>
          <button
            className={`filter-btn ${filterStatus === "accepted" ? "active" : ""}`}
            onClick={() => setFilterStatus("accepted")}
          >
            Đã chấp nhận
          </button>
          <button
            className={`filter-btn ${filterStatus === "rejected" ? "active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            Đã từ chối
          </button>
        </div>
      </div>

      {error && <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>Chưa có bài nộp nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "10%", whiteSpace: "nowrap" }}>ID</th>
                <th style={{ width: "25%", whiteSpace: "nowrap" }}>Đề bài</th>
                <th style={{ width: "15%", whiteSpace: "nowrap" }}>Người dùng</th>
                <th style={{ width: "12%", whiteSpace: "nowrap" }}>Ngôn ngữ</th>
                <th style={{ width: "15%", whiteSpace: "nowrap" }}>Trạng thái</th>
                <th style={{ width: "10%", whiteSpace: "nowrap" }}>Thời gian</th>
                <th style={{ width: "10%", whiteSpace: "nowrap" }}>Bộ nhớ</th>
                <th style={{ width: "13%", whiteSpace: "nowrap" }}>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.IdBaiNop}>
                  <td style={{ fontFamily: "monospace", fontSize: "13px" }}>#{s.IdBaiNop}</td>
                  <td>
                    <a href={`/problems/${s.IdDeBai}`} className="problem-link">
                      {s.deBai?.TieuDe || `Đề bài ${s.IdDeBai}`}
                    </a>
                  </td>
                  <td>
                    {s.taiKhoan?.IdTaiKhoan ? (
                      <a href={`/users/${s.taiKhoan.IdTaiKhoan}`} className="problem-link">
                        {s.taiKhoan?.HoTen || `Người dùng ${s.IdTaiKhoan}`}
                      </a>
                    ) : (
                      `Người dùng ${s.IdTaiKhoan}`
                    )}
                  </td>
                  <td>{s.ngonNgu?.TenNhanDien || `Ngôn ngữ ${s.IdNgonNgu}`}</td>
                  <td>
                    {getStatusDisplay(s.TrangThaiCham)}
                  </td>
                  <td>
                    {s.ThoiGianThucThi ? `${s.ThoiGianThucThi}ms` : "-"}
                  </td>
                  <td>
                    {s.BoNhoSuDung ? `${s.BoNhoSuDung}KB` : "-"}
                  </td>
                  <td style={{ fontSize: "12px", color: "#666" }}>
                    {s.NgayNop ? new Date(s.NgayNop).toLocaleString("vi-VN") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
