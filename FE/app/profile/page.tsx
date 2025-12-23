"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ContributionGraph from "../components/ContributionGraph";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface User {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

interface UserStats {
  totalSubmissions: number;
  successfulSubmissions: number;
  participatedContests: number;
}

interface StatData {
  date: string;
  count: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<StatData[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Hồ sơ bản thân - OJ Portal";
    }
    
    if (typeof window !== "undefined") {
      const userStr = window.localStorage.getItem("oj_user");
      const token = window.localStorage.getItem("oj_token");

      if (!userStr || !token) {
        router.push("/auth/login");
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        fetchStats(userData.IdTaiKhoan);
        fetchUserStats(userData.IdTaiKhoan);
      } catch (e) {
        console.error("Failed to parse user", e);
        router.push("/auth/login");
      }
    }
  }, [router]);

  const fetchStats = async (userId: string) => {
    try {
      const token = window.localStorage.getItem("oj_token");
      const res = await fetch(`${API_BASE}/api/submissions/stats/${userId}?groupBy=day`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      // Chỉ log error nếu không phải connection refused (server chưa chạy)
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        console.warn("Server không khả dụng. Vui lòng đảm bảo server đang chạy.");
      } else {
        console.error("Error fetching stats:", error);
      }
    }
  };

  const fetchUserStats = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const data = await res.json();
      setUserStats({
        totalSubmissions: data.stats.totalSubmissions,
        successfulSubmissions: data.stats.successfulSubmissions || 0,
        participatedContests: data.stats.participatedContests || 0,
      });
    } catch (error) {
      // Chỉ log error nếu không phải connection refused (server chưa chạy)
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        console.warn("Server không khả dụng. Vui lòng đảm bảo server đang chạy.");
      } else {
        console.error("Error fetching user stats:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats(user.IdTaiKhoan);
      fetchUserStats(user.IdTaiKhoan);
    }
  }, [user]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("oj_token");
      window.localStorage.removeItem("oj_user");
      router.push("/");
    }
  };

  const handleEditName = () => {
    setEditingName(true);
    setNewName(user?.HoTen || "");
    setNameError(null);
  };

  const handleSaveName = async () => {
    if (!user) return;

    if (!newName.trim()) {
      setNameError("Họ tên không được để trống");
      return;
    }

    if (newName.trim().length < 2) {
      setNameError("Họ tên phải có ít nhất 2 ký tự");
      return;
    }

    setSaving(true);
    setNameError(null);

    try {
      const token = window.localStorage.getItem("oj_token");
      const res = await fetch(`${API_BASE}/api/users/${user.IdTaiKhoan}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ HoTen: newName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Không thể cập nhật tên");
      }

      // Cập nhật user trong state và localStorage
      const updatedUser = { ...user, HoTen: data.HoTen };
      setUser(updatedUser);
      window.localStorage.setItem("oj_user", JSON.stringify(updatedUser));
      
      setEditingName(false);
      // Dispatch event để AuthBar cập nhật
      window.dispatchEvent(new CustomEvent("authChange"));
    } catch (err: any) {
      setNameError(err.message || "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName("");
    setNameError(null);
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="section-title">Hồ sơ bản thân</h1>

      {/* Stats Cards - Large */}
      {userStats && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "20px", 
          marginBottom: "24px",
          maxWidth: "900px",
          margin: "0 auto 24px auto"
        }}>
          <div className="card" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số bài nạp</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#667eea" }}>
              {userStats.totalSubmissions}
            </div>
          </div>
          <div className="card" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số bài thành công</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#48bb78" }}>
              {userStats.successfulSubmissions}
            </div>
          </div>
          <div className="card" style={{ padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Số cuộc thi tham gia</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#764ba2" }}>
              {userStats.participatedContests}
            </div>
          </div>
        </div>
      )}

      {/* User Info Card */}
      <div className="card" style={{ marginBottom: "24px", maxWidth: "900px", margin: "0 auto 24px auto" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Thông tin tài khoản</h2>
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <strong>Tên đăng nhập:</strong> {user.TenDangNhap}
          </div>
          <div>
            <strong>Họ tên:</strong>{" "}
            {editingName ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNameError(null);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: nameError ? "1px solid #c62828" : "1px solid #ddd",
                    fontSize: "14px",
                    flex: "1",
                    minWidth: "200px",
                  }}
                  placeholder="Nhập họ tên mới"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="button"
                  style={{ padding: "6px 16px", fontSize: "14px" }}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: "6px 16px",
                    fontSize: "14px",
                    background: "#e0e0e0",
                    color: "#666",
                    border: "none",
                    borderRadius: "4px",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <span>
                {user.HoTen}{" "}
                <button
                  onClick={handleEditName}
                  style={{
                    marginLeft: "8px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    background: "transparent",
                    border: "1px solid #667eea",
                    color: "#667eea",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Sửa
                </button>
              </span>
            )}
            {nameError && (
              <div style={{ color: "#c62828", fontSize: "13px", marginTop: "4px" }}>{nameError}</div>
            )}
          </div>
          <div>
            <strong>Email:</strong> {user.Email}
          </div>
          <div>
            <strong>Vai trò:</strong> {user.VaiTro}
          </div>
        </div>
      </div>

      {/* Contribution Graph - Centered */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        marginBottom: "24px",
        width: "100%"
      }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", fontSize: "16px", color: "#666", maxWidth: "900px", width: "100%", margin: "0 auto" }}>
            Đang tải dữ liệu...
          </div>
        ) : stats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#666", maxWidth: "900px", width: "100%", margin: "0 auto" }}>
            Chưa có dữ liệu nạp bài nào
          </div>
        ) : (
          <div style={{ 
            maxWidth: "900px", 
            width: "100%"
          }}>
            <ContributionGraph data={stats} />
          </div>
        )}
      </div>
    </div>
  );
}

