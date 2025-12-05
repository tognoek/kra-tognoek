"use client";

import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

async function fetchContests() {
  const res = await fetch(`${API_BASE}/api/contests`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được cuộc thi");
  return res.json();
}

export default function ContestsPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "closed">("all");

  useEffect(() => {
    fetchContests()
      .then((d) => {
        setData(d);
        setFiltered(d);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => c.TenCuocThi?.toLowerCase().includes(query));
    }

    // Status filter
    if (filterStatus === "active") {
      result = result.filter((c) => c.TrangThai);
    } else if (filterStatus === "closed") {
      result = result.filter((c) => !c.TrangThai);
    }

    // Sort by start time
    result.sort(
      (a, b) =>
        new Date(b.ThoiGianBatDau).getTime() - new Date(a.ThoiGianBatDau).getTime()
    );

    setFiltered(result);
  }, [data, searchQuery, filterStatus]);

  const getContestStatus = (contest: any) => {
    const now = new Date();
    const start = new Date(contest.ThoiGianBatDau);
    const end = new Date(contest.ThoiGianKetThuc);

    if (!contest.TrangThai) return "Closed";
    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Running";
    return "Finished";
  };

  if (loading) {
    return (
      <div>
        <h1 className="section-title">Contests</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="section-title">Contests</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">Contests</h1>
      <p className="section-sub">Danh sách các cuộc thi lập trình</p>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm contest..."
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
            className={`filter-btn ${filterStatus === "active" ? "active" : ""}`}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterStatus === "closed" ? "active" : ""}`}
            onClick={() => setFilterStatus("closed")}
          >
            Closed
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <p>Không tìm thấy contest nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Tên Contest</th>
                <th style={{ width: "20%" }}>Bắt đầu</th>
                <th style={{ width: "20%" }}>Kết thúc</th>
                <th style={{ width: "15%" }}>Trạng thái</th>
                <th style={{ width: "15%" }}>Problems</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const status = getContestStatus(c);
                return (
                  <tr key={c.IdCuocThi}>
                    <td style={{ fontWeight: 600 }}>{c.TenCuocThi || `Contest ${c.IdCuocThi}`}</td>
                    <td>{new Date(c.ThoiGianBatDau).toLocaleString("vi-VN")}</td>
                    <td>{new Date(c.ThoiGianKetThuc).toLocaleString("vi-VN")}</td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td>{c.deBais?.length || 0} bài</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
