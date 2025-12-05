"use client";

import { useState, useEffect } from "react";
import SubmitForm from "./submit-form";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

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
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
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
      result = result.filter(
        (s) =>
          s.IdBaiNop?.toString().includes(query) ||
          s.deBai?.TieuDe?.toLowerCase().includes(query) ||
          s.taiKhoan?.TenTaiKhoan?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus === "pending") {
      result = result.filter((s) => s.TrangThaiCham === "pending");
    } else if (filterStatus === "accepted") {
      result = result.filter((s) => s.TrangThaiCham === "accepted" || s.TrangThaiCham === "AC");
    } else if (filterStatus === "rejected") {
      result = result.filter(
        (s) =>
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
        <h1 className="section-title">Submissions</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className="section-title">Submissions</h1>
          <p className="section-sub">Nộp bài và xem kết quả chấm</p>
        </div>
        <button className="button" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Ẩn form" : "Nộp bài mới"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: "24px" }}>
          <SubmitForm onSuccess={loadSubmissions} />
        </div>
      )}

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
            Pending
          </button>
          <button
            className={`filter-btn ${filterStatus === "accepted" ? "active" : ""}`}
            onClick={() => setFilterStatus("accepted")}
          >
            Accepted
          </button>
          <button
            className={`filter-btn ${filterStatus === "rejected" ? "active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected
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
                <th style={{ width: "10%" }}>ID</th>
                <th style={{ width: "25%" }}>Problem</th>
                <th style={{ width: "15%" }}>User</th>
                <th style={{ width: "12%" }}>Language</th>
                <th style={{ width: "15%" }}>Status</th>
                <th style={{ width: "10%" }}>Time</th>
                <th style={{ width: "10%" }}>Memory</th>
                <th style={{ width: "13%" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.IdBaiNop}>
                  <td style={{ fontFamily: "monospace", fontSize: "13px" }}>#{s.IdBaiNop}</td>
                  <td>
                    <a href={`/problems/${s.IdDeBai}`} className="problem-link">
                      {s.deBai?.TieuDe || `Problem ${s.IdDeBai}`}
                    </a>
                  </td>
                  <td>{s.taiKhoan?.TenTaiKhoan || `User ${s.IdTaiKhoan}`}</td>
                  <td>{s.ngonNgu?.TenNhanDien || `Lang ${s.IdNgonNgu}`}</td>
                  <td>
                    <StatusBadge status={s.TrangThaiCham || "pending"} />
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
