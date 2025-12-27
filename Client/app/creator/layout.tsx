"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function CreateLayout({ children }: { children: ReactNode }) {
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
        <h2 style={{ marginTop: 0 }}>Bạn không có quyền truy cập trang Admin</h2>
        <p>Vui lòng đăng nhập bằng tài khoản Admin.</p>
        <Link href="/" className="button" style={{ marginTop: 12, display: "inline-block" }}>
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/creator" className="nav-link" style={{ paddingLeft: 0 }}>
            Bảng điều khiển
          </Link>
          <Link href="/creator/problems/create" className="nav-link">
            Tạo bài tập
            </Link>
          <Link href="/creator/contests/create" className="nav-link">
            Tạo cuộc thi
          </Link>
          <Link href="/creator/problems" className="nav-link">
            Danh sách các bài tập
          </Link>
          <Link href="/creator/contests" className="nav-link">
            Danh sách các cuộc thi
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}


