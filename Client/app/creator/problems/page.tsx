"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Problem {
  IdDeBai: string;
  TieuDe: string;
  DoKho: number; // 1 -> 10
  GioiHanThoiGian: number;
  GioiHanBoNho: number;
  DangCongKhai: boolean;
  TrangThai: boolean;
  NgayTao: string;
  IdTaiKhoan: string;
}

export default function MyProblemListPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // States bộ lọc Client (chỉ lọc trên danh sách đã tải về của user đó)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // 1. Lấy User ID từ LocalStorage
    if (typeof window !== "undefined") {
      const savedUser = window.localStorage.getItem("oj_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUserId(parsed.IdTaiKhoan);
        } catch (e) {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  // 2. Gọi API get available khi có userId
  useEffect(() => {
    if (userId) {
      fetchMyProblems(userId);
    }
  }, [userId]);

  const fetchMyProblems = async (id: string) => {
    try {
      // GỌI API MỚI: Chỉ lấy bài của user này
      const res = await fetch(`${API_BASE}/api/problems/available?userId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      } else {
        console.error("Lỗi khi tải dữ liệu");
      }
    } catch (e) {
      console.error("Lỗi kết nối:", e);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC LỌC TÌM KIẾM (Client Side trên danh sách của user) ---
  const filteredProblems = problems.filter((p) => {
    const title = (p.TieuDe || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    
    // Tìm theo tên
    const matchName = title.includes(search);
    
    // Tìm theo độ khó
    let matchDiff = true;
    if (filterDifficulty !== "all") {
      // Parse về số để so sánh an toàn
      const val = Number(p.DoKho) || 0; 
      if (filterDifficulty === "easy") matchDiff = val >= 1 && val <= 3;
      if (filterDifficulty === "medium") matchDiff = val >= 4 && val <= 7;
      if (filterDifficulty === "hard") matchDiff = val >= 8 && val <= 10;
    }
    
    return matchName && matchDiff;
  });

  // --- PHÂN TRANG ---
  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);
  const currentItems = filteredProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- HELPER: Hiển thị độ khó 1-10 ---
  const renderDifficulty = (val: any) => {
    const level = Number(val) || 0;
    let color = "#6b7280"; 
    let bg = "#f3f4f6";
    let label = "Chưa xđ";

    if (level >= 1 && level <= 3) {
      color = "#059669"; bg = "#d1fae5"; label = "Dễ";
    } else if (level >= 4 && level <= 7) {
      color = "#d97706"; bg = "#fef3c7"; label = "Trung bình";
    } else if (level >= 8 && level <= 10) {
      color = "#dc2626"; bg = "#fee2e2"; label = "Khó";
    }

    return (
      <span style={{
        backgroundColor: bg, color: color,
        padding: "4px 10px", borderRadius: "99px",
        fontSize: "12px", fontWeight: "bold",
        display: "inline-flex", alignItems: "center", gap: "4px"
      }}>
        {label} <span style={{fontSize: '10px', opacity: 0.8}}>({level}/10)</span>
      </span>
    );
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Đang tải danh sách bài tập của bạn...</div>;

  return (
    <div style={{
      maxWidth: "1200px", margin: "0 auto", padding: "30px 20px",
      fontFamily: "system-ui, -apple-system, sans-serif", color: "#333"
    }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Kho bài tập của tôi
          </h1>
          <p style={{ margin: "5px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
            Quản lý các bài tập bạn đã tạo (Sử dụng API /available)
          </p>
        </div>
        <Link href="/creator/problems/create" style={{
            backgroundColor: "#2563eb", color: "white", padding: "10px 20px",
            borderRadius: "6px", textDecoration: "none", fontWeight: "600",
            fontSize: "14px", display: "inline-block", transition: "background 0.2s"
          }}
        >
          + Tạo bài tập mới
        </Link>
      </div>

      {/* FILTER BAR */}
      <div style={{
        backgroundColor: "white", padding: "20px", borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb",
        marginBottom: "24px", display: "flex", flexWrap: "wrap", gap: "16px"
      }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
            Tìm kiếm
          </label>
          <input
            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none" }}
            placeholder="Nhập tên bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: "200px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
            Độ khó
          </label>
          <select
            style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none", cursor: "pointer" }}
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="easy">Dễ (1 - 3)</option>
            <option value="medium">Trung bình (4 - 7)</option>
            <option value="hard">Khó (8 - 10)</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "14px 24px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" }}>ID</th>
              <th style={{ padding: "14px 24px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" }}>Tiêu đề</th>
              <th style={{ padding: "14px 24px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" }}>Độ khó</th>
              <th style={{ padding: "14px 24px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" }}>Giới hạn</th>
              <th style={{ padding: "14px 24px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" }}>Trạng thái</th>
              <th style={{ padding: "14px 24px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  Chưa có dữ liệu nào.
                </td>
              </tr>
            ) : (
              currentItems.map((prob, index) => (
                <tr 
                  key={prob.IdDeBai} 
                  style={{ borderBottom: "1px solid #e5e7eb", transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                >
                  <td style={{ padding: "16px 24px", fontSize: "14px", fontFamily: "monospace", color: "#6b7280", fontWeight: "bold" }}>
                    #{prob.IdDeBai}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#111827", marginBottom: "4px" }}>
                      {prob.TieuDe}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Ngày tạo: {prob.NgayTao ? new Date(prob.NgayTao).toLocaleDateString("vi-VN") : "N/A"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {renderDifficulty(prob.DoKho)}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "13px", fontFamily: "monospace", color: "#4b5563" }}>
                    <div>⏱ {prob.GioiHanThoiGian}ms</div>
                    <div style={{ marginTop: "2px" }}>💾 {prob.GioiHanBoNho}MB</div>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    {prob.TrangThai ? (
                      <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Active</span>
                    ) : (
                      <span style={{ backgroundColor: "#f3f4f6", color: "#374151", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Hidden</span>
                    )}
                    <div style={{ marginTop: "4px", fontSize: "11px" }}>
                      {prob.DangCongKhai ? (
                        <span style={{color: "#2563eb"}}>🌎 Công khai</span>
                      ) : (
                        <span style={{color: "#d97706"}}>🔒 Riêng tư</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    <button
                      onClick={() => router.push(`/creator/problems/${prob.IdDeBai}`)}
                      style={{
                        backgroundColor: "#4f46e5", color: "white", border: "none",
                        padding: "6px 14px", borderRadius: "4px", fontSize: "12px",
                        fontWeight: "600", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px", backgroundColor: currentPage === 1 ? "#f3f4f6" : "white",
              color: currentPage === 1 ? "#9ca3af" : "#374151", border: "1px solid #d1d5db",
              borderRadius: "6px", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "14px"
            }}
          >
            &lt; Trước
          </button>

          <span style={{ fontSize: "14px", color: "#4b5563" }}>
            Trang <b>{currentPage}</b> / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px", backgroundColor: currentPage === totalPages ? "#f3f4f6" : "white",
              color: currentPage === totalPages ? "#9ca3af" : "#374151", border: "1px solid #d1d5db",
              borderRadius: "6px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "14px"
            }}
          >
            Sau &gt;
          </button>
        </div>
      )}
    </div>
  );
}