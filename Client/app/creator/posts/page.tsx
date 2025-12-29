"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Post {
  IdBaiDang: string;
  TieuDe: string;
  UuTien: number;
  TrangThai: boolean;
  NgayTao: string;
  IdTaiKhoan: string;
}

export default function MyPostsListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = window.localStorage.getItem("oj_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchPosts(parsed.IdTaiKhoan, parsed.VaiTro);
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const fetchPosts = async (userId: string, role: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/manage?userId=${userId}&role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error("Lỗi kết nối:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.TieuDe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const currentItems = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Đang tải danh sách bài viết...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>Quản lý Bài đăng</h1>
          <p style={{ margin: "5px 0 0 0", color: "#6b7280", fontSize: "14px" }}>Xem và chỉnh sửa các bài viết/thông báo của bạn.</p>
        </div>
        <Link href="/creator/posts/create" style={{ backgroundColor: "#2563eb", color: "white", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
          + Viết bài mới
        </Link>
      </div>

      <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
        <input
          style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", outline: "none" }}
          placeholder="Tìm kiếm tiêu đề bài đăng..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "14px 24px", textAlign: "left", fontSize: "12px", color: "#4b5563", textTransform: "uppercase" }}>Tiêu đề</th>
              <th style={{ padding: "14px 24px", textAlign: "center", fontSize: "12px", color: "#4b5563", textTransform: "uppercase" }}>Ưu tiên</th>
              <th style={{ padding: "14px 24px", textAlign: "center", fontSize: "12px", color: "#4b5563", textTransform: "uppercase" }}>Trạng thái</th>
              <th style={{ padding: "14px 24px", textAlign: "center", fontSize: "12px", color: "#4b5563", textTransform: "uppercase" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#666" }}>Chưa có bài đăng nào.</td></tr>
            ) : (
              currentItems.map((post) => (
                <tr key={post.IdBaiDang} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontWeight: "600", color: "#111827" }}>{post.TieuDe}</div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>Ngày đăng: {new Date(post.NgayTao).toLocaleDateString("vi-VN")}</div>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: "#f3f4f6", fontSize: "12px" }}>Cấp {post.UuTien}</span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    {post.TrangThai ? 
                      <span style={{ color: "#059669", fontWeight: "700", fontSize: "12px" }}>● CÔNG KHAI</span> : 
                      <span style={{ color: "#dc2626", fontWeight: "700", fontSize: "12px" }}>● ĐANG ẨN</span>
                    }
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    <button onClick={() => router.push(`/creator/posts/${post.IdBaiDang}`)} style={{ backgroundColor: "#4f46e5", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                      Sửa bài
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}