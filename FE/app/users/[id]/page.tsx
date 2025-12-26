"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "../../components/StatusBadge";
import ContributionGraph from "../../components/ContributionGraph";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface UserDetail {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  TrangThai: boolean;
  NgayTao: string;
  VaiTro: string;
  stats: {
    totalProblems: number;
    totalSubmissions: number;
    successfulSubmissions: number;
    totalContests: number;
    participatedContests: number;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${params.id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Người dùng không tồn tại");
          }
          throw new Error("Không tải được thông tin người dùng");
        }

        const data = await res.json();
        setUser(data);
        
        // Fetch submission stats for contribution graph
        try {
          const statsRes = await fetch(`${API_BASE}/api/submissions/stats/${params.id}?groupBy=day`, {
            cache: "no-store",
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        } catch (err) {
          console.error("Failed to fetch stats:", err);
        }
        
        // Update page title
        if (typeof document !== "undefined") {
          document.title = `Thông tin hồ sơ của ${data.HoTen || data.TenDangNhap || `Người dùng ${params.id}`} - OJ Portal`;
        }
      } catch (e: any) {
        setError(e.message);
        if (typeof document !== "undefined") {
          document.title = "Thông tin hồ sơ - OJ Portal";
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <h1 className="section-title">Thông tin hồ sơ</h1>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div>
        <h1 className="section-title">Thông tin hồ sơ</h1>
        <p style={{ color: "red" }}>{error || "Không tìm thấy người dùng"}</p>
        <Link href="/" className="button" style={{ marginTop: "16px", display: "inline-block" }}>
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 className="section-title">Thông tin hồ sơ của {user.HoTen}</h1>
      </div>

      {/* Stats Cards - Large and Centered */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "20px", 
        marginBottom: "24px",
        maxWidth: "900px",
        margin: "0 auto 24px auto"
      }}>
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Tổng số bài nộp</div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#667eea" }}>
            {user.stats.totalSubmissions}
          </div>
        </div>
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số bài thành công</div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#48bb78" }}>
            {user.stats.successfulSubmissions}
          </div>
        </div>
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số cuộc thi tham gia</div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#764ba2" }}>
            {user.stats.participatedContests}
          </div>
        </div>
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số đề bài đã tạo</div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#f59e0b" }}>
            {user.stats.totalProblems}
          </div>
        </div>
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số cuộc thi đã tạo</div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#ec4899" }}>
            {user.stats.totalContests}
          </div>
        </div>
      </div>

      {/* Contribution Graph - Centered */}
      {stats.length > 0 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          marginBottom: "24px",
          width: "100%"
        }}>
          <div style={{ 
            maxWidth: "900px", 
            width: "100%"
          }}>
            <ContributionGraph data={stats} />
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="form-card" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", marginTop: 0 }}>
          Thông tin tài khoản
        </h2>
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <strong>Tên đăng nhập:</strong> {user.TenDangNhap}
          </div>
          <div>
            <strong>Họ tên:</strong> {user.HoTen}
          </div>
          <div>
            <strong>Email:</strong> {user.Email}
          </div>
          <div>
            <strong>Vai trò:</strong> {user.VaiTro}
          </div>
          <div>
            <strong>Trạng thái:</strong>{" "}
            <StatusBadge status={user.TrangThai ? "Hoạt động" : "Không hoạt động"} />
          </div>
          <div>
            <strong>Ngày tạo:</strong> {new Date(user.NgayTao).toLocaleString("vi-VN")}
          </div>
        </div>
      </div>

    </div>
  );
}

