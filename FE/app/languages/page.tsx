"use client";

import { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function fetchLanguages() {
  const res = await fetch(`${API_BASE}/api/languages`, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được ngôn ngữ");
  return res.json();
}

export default function LanguagesPage() {
  const [data, setData] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Ngôn ngữ lập trình - OJ Portal";
    }
    
    fetchLanguages()
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
        (l) =>
          l.TenNhanDien?.toLowerCase().includes(query) ||
          l.TenNgonNgu?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus === "active") {
      result = result.filter((l) => l.TrangThai);
    } else if (filterStatus === "inactive") {
      result = result.filter((l) => !l.TrangThai);
    }

    setFiltered(result);
  }, [data, searchQuery, filterStatus]);

  if (loading) {
    return (
      <div>
        <h1 className="section-title">Languages</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="section-title">Languages</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">Languages</h1>
      <p className="section-sub">Danh sách các ngôn ngữ lập trình được hỗ trợ</p>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm kiếm ngôn ngữ..."
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
            Đang dùng
          </button>
          <button
            className={`filter-btn ${filterStatus === "inactive" ? "active" : ""}`}
            onClick={() => setFilterStatus("inactive")}
          >
            Tắt
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💻</div>
          <p>Không tìm thấy ngôn ngữ nào.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((l) => (
            <div key={l.IdNgonNgu} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div>
                  <div className="card-title">{l.TenNhanDien || `Language ${l.IdNgonNgu}`}</div>
                  <div className="card-desc" style={{ marginTop: "4px" }}>
                    {l.TenNgonNgu || "N/A"}
                  </div>
                </div>
                <StatusBadge status={l.TrangThai ? "Active" : "Inactive"} />
              </div>
              {l.MoTa && (
                <div style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
                  {l.MoTa}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
