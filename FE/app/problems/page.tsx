"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "../components/StatusBadge";
import DifficultyBadge from "../components/DifficultyBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function fetchProblems() {
  const res = await fetch(`${API_BASE}/api/problems`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách đề");
  return res.json();
}

export default function ProblemsPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublic, setFilterPublic] = useState<"all" | "public" | "private">("all");
  const [sortBy, setSortBy] = useState<"newest" | "difficulty">("newest");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Danh sách đề bài - OJ Portal";
    }
    
    fetchProblems()
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
      result = result.filter(
        (p) =>
          p.TieuDe?.toLowerCase().includes(query) ||
          p.NoiDungDeBai?.toLowerCase().includes(query)
      );
    }

    // Public/Private filter
    if (filterPublic === "public") {
      result = result.filter((p) => p.DangCongKhai);
    } else if (filterPublic === "private") {
      result = result.filter((p) => !p.DangCongKhai);
    }

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.NgayTao).getTime() - new Date(a.NgayTao).getTime());
    } else {
      result.sort((a, b) => (a.DoKho || 0) - (b.DoKho || 0));
    }

    setFiltered(result);
  }, [data, searchQuery, filterPublic, sortBy]);

  if (loading) {
    return (
      <div>
        <h1 className="section-title">Problems</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="section-title">Problems</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">Problems</h1>
      <p className="section-sub">Danh sách các đề bài lập trình</p>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm theo tên hoặc nội dung..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="filter-group">
          <button
            className={`filter-btn ${filterPublic === "all" ? "active" : ""}`}
            onClick={() => setFilterPublic("all")}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterPublic === "public" ? "active" : ""}`}
            onClick={() => setFilterPublic("public")}
          >
            Public
          </button>
          <button
            className={`filter-btn ${filterPublic === "private" ? "active" : ""}`}
            onClick={() => setFilterPublic("private")}
          >
            Private
          </button>
        </div>
        <select
          className="select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{ width: "150px" }}
        >
          <option value="newest">Mới nhất</option>
          <option value="difficulty">Độ khó</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>Không tìm thấy đề bài nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Title</th>
                <th style={{ width: "12%" }}>Difficulty</th>
                <th style={{ width: "10%" }}>Time Limit</th>
                <th style={{ width: "10%" }}>Memory Limit</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "18%" }}>Người tạo</th>
                <th style={{ width: "10%" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.IdDeBai}>
                  <td>
                    <Link href={`/problems/${p.IdDeBai}`} className="problem-link">
                      {p.TieuDe || `Problem ${p.IdDeBai}`}
                    </Link>
                  </td>
                  <td>
                    <DifficultyBadge difficulty={p.DoKho || 0} />
                  </td>
                  <td>{p.GioiHanThoiGian ? `${p.GioiHanThoiGian}ms` : "-"}</td>
                  <td>{p.GioiHanBoNho ? `${p.GioiHanBoNho}KB` : "-"}</td>
                  <td>
                    <StatusBadge status={p.DangCongKhai ? "Public" : "Private"} />
                  </td>
                  <td>
                    {p.taiKhoan ? (
                      <Link href={`/users/${p.taiKhoan.IdTaiKhoan}`} className="problem-link">
                        {p.taiKhoan.TenDangNhap}
                      </Link>
                    ) : (
                      <span style={{ color: "#999" }}>N/A</span>
                    )}
                  </td>
                  <td style={{ fontSize: "12px", color: "#666" }}>
                    {p.NgayTao ? new Date(p.NgayTao).toLocaleDateString("vi-VN") : "-"}
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
