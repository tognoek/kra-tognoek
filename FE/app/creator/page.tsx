"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function CreatorPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("oj_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch (e) {
        console.error("Parse user failed", e);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const isAdmin = user?.VaiTro?.toLowerCase() === "admin";
  const isCreator = user?.VaiTro?.toLowerCase() === "creator" || isAdmin;

  if (loading) {
    return <div style={{ padding: 24 }}>Đang kiểm tra quyền...</div>;
  }

  if (!isCreator) {
    return (
      <div className="form-card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Bạn không có quyền truy cập</h2>
        <p>Chỉ tài khoản có quyền đăng đề/tạo cuộc thi (Creator) hoặc Admin mới truy cập được.</p>
        <button className="button" onClick={() => router.push("/")} style={{ marginTop: 12 }}>
          ← Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">Chức năng</h1>
      <p className="section-sub">
        Khu vực dành cho người có quyền đăng bài và tạo cuộc thi.
      </p>

      <div className="card-grid" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="card" onClick={() => router.push("/problems/create")} style={{ cursor: "pointer" }}>
          <div className="card-title">✏️ Tạo đề</div>
          <p className="card-desc">Đăng một bài tập lập trình mới.</p>
        </div>
        <div className="card" onClick={() => router.push("/contests/create")} style={{ cursor: "pointer" }}>
          <div className="card-title">🏆 Tạo cuộc thi</div>
          <p className="card-desc">Tạo một cuộc thi và thêm đề vào.</p>
        </div>
        <div className="card">
          <div className="card-title">📈 Thống kê</div>
          <p className="card-desc">Xem thống kê đơn giản cho đề/cuộc thi bạn tạo.</p>
          <p style={{ fontSize: 12, color: "#999" }}>Placeholder, sẽ cần API/stats chi tiết.</p>
        </div>
      </div>
    </div>
  );
}

