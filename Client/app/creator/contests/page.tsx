"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Contest {
  IdCuocThi: string;
  TenCuocThi: string;
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  TrangThai: boolean;
  taiKhoan: {
    TenDangNhap: string;
  };
  _count?: {
    dangKys: number;
    baiNops: number;
  };
  stats?: {
    totalRegistrations: number;
  };
}

export default function ContestListPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

 useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = window.localStorage.getItem("oj_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUserId(parsed.IdTaiKhoan);
        } catch (e) {
          console.error("Lỗi parse user:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMyContests(userId);
    } else {
       setLoading(false); 
    }
  }, [userId]);

  const fetchMyContests = async (uid: string) => {
    try {
      setLoading(true);
      
      const res = await fetch(`${API_BASE}/api/creator_contest/by-user/${uid}`);
      
      if (res.ok) {
        const data = await res.json();
        setContests(data);
      } else {
        console.error("Lỗi tải data");
      }
    } catch (e) {
      console.error("Lỗi kết nối:", e);
    } finally {
      setLoading(false);
    }
  };
  // Logic lọc
  const filteredContests = contests.filter((c) => {
    const matchName = c.TenCuocThi.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = c.TrangThai === true;
    if (filterStatus === "hidden") matchStatus = c.TrangThai === false;
    return matchName && matchStatus;
  });

  // Logic phân trang
  const totalPages = Math.ceil(filteredContests.length / itemsPerPage);
  const currentItems = filteredContests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#6b7280", fontFamily: "system-ui" }}>
      Đang tải dữ liệu...
    </div>
  );

  return (
    <div style={{
      backgroundColor: "#f3f4f6",
      minHeight: "100vh",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      color: "#333"
    }}>

      {/* MAIN CARD */}
      <div style={{
        backgroundColor: "#ffffff",
        maxWidth: "1200px",
        margin: "0 auto",
        borderRadius: "12px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        overflow: "hidden"
      }}>

        {/* HEADER SECTION */}
        <div style={{
          padding: "24px 32px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>
              Quản lý Cuộc thi
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
              Danh sách và trạng thái các kỳ thi lập trình
            </p>
          </div>
          <Link 
            href="/contests/create" 
            style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
          >
            + Tạo cuộc thi mới
          </Link>
        </div>

        {/* FILTERS SECTION */}
        <div style={{
          padding: "20px 32px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            {/* Search Icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
            >
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên cuộc thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px 10px 40px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                outline: "none",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
            />
          </div>

          <div style={{ minWidth: "200px" }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                outline: "none",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang mở (Active)</option>
              <option value="hidden">Đã đóng (Hidden)</option>
            </select>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "16px 32px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>ID</th>
                <th style={{ padding: "16px 32px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Thông tin cuộc thi</th>
                <th style={{ padding: "16px 32px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Thời gian</th>
                <th style={{ padding: "16px 32px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Thí sinh</th>
                <th style={{ padding: "16px 32px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Trạng thái</th>
                <th style={{ padding: "16px 32px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#6b7280", fontStyle: "italic" }}>
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              ) : (
                currentItems.map((contest) => (
                  <tr 
                    key={contest.IdCuocThi} 
                    style={{ borderBottom: "1px solid #e5e7eb", transition: "background 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <td style={{ padding: "16px 32px", fontFamily: "monospace", fontWeight: "600", color: "#6b7280", fontSize: "14px" }}>
                      #{contest.IdCuocThi}
                    </td>
                    <td style={{ padding: "16px 32px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", color: "#111827", fontSize: "15px" }}>{contest.TenCuocThi}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 32px" }}>
                      <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#059669", marginBottom: "4px" }}>
                        BĐ: {formatDate(contest.ThoiGianBatDau)}
                      </div>
                      <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#dc2626" }}>
                        KT: {formatDate(contest.ThoiGianKetThuc)}
                      </div>
                    </td>
                    <td style={{ padding: "16px 32px", textAlign: "center", fontWeight: "600", color: "#374151", fontSize: "15px" }}>
                      {contest.stats?.totalRegistrations || contest._count?.dangKys || 0}
                    </td>
                    <td style={{ padding: "16px 32px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: contest.TrangThai ? "#d1fae5" : "#f3f4f6",
                        color: contest.TrangThai ? "#065f46" : "#374151"
                      }}>
                        {contest.TrangThai ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 32px", textAlign: "right" }}>
                      <button
                        onClick={() => router.push(`/creator/contests/${contest.IdCuocThi}`)}
                        style={{
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          color: "#374151",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION SECTION */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 32px",
            borderTop: "1px solid #e5e7eb"
          }}>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              Trang <strong>{currentPage}</strong> / {totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #d1d5db",
                  backgroundColor: currentPage === 1 ? "#f3f4f6" : "white",
                  borderRadius: "6px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  color: currentPage === 1 ? "#9ca3af" : "#374151",
                  opacity: currentPage === 1 ? 0.7 : 1
                }}
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #d1d5db",
                  backgroundColor: currentPage === totalPages ? "#f3f4f6" : "white",
                  borderRadius: "6px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  color: currentPage === totalPages ? "#9ca3af" : "#374151",
                  opacity: currentPage === totalPages ? 0.7 : 1
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}