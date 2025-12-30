"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTextIcon } from "@/scripts/icon";

interface User {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function AuthBar() {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const updateUser = () => {
    if (typeof window !== "undefined") {
      const userStr = window.localStorage.getItem("oj_user");
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error("Failed to parse user", e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    updateUser();

    const handleStorageChange = () => updateUser();
    const handleAuthChange = () => updateUser();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("oj_token");
      window.localStorage.removeItem("oj_user");
      setUser(null);
      setShowDropdown(false);
      router.push("/");
    }
  };

  const isAdmin = user?.VaiTro?.toLowerCase() === "admin";
  const isCreator = isAdmin || user?.VaiTro?.toLowerCase() === "creator";

  if (user) {
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <button
          className="button"
          style={{ 
            padding: "8px 16px", 
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", // Đổi màu gradient cho đồng bộ với trang login mới
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {getTextIcon(user.TenDangNhap)} {user.HoTen}
        </button>
        {showDropdown && (
          <>
            <div
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
              onClick={() => setShowDropdown(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "white",
                border: "1px solid #f1f5f9",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                minWidth: "220px",
                zIndex: 999,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{user.HoTen}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{user.Email}</div>
                <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "8px", fontWeight: 700, textTransform: "uppercase" }}>
                   {user.VaiTro}
                </div>
              </div>
              
              <button className="dropdown-item" onClick={() => { setShowDropdown(false); router.push("/profile"); }}>
                👤 Hồ sơ cá nhân
              </button>

              {isAdmin && (
                <button className="dropdown-item" onClick={() => { setShowDropdown(false); router.push("/admin"); }}>
                  🛡️ Quản trị hệ thống
                </button>
              )}

              {isCreator && (
                <button className="dropdown-item" onClick={() => { setShowDropdown(false); router.push("/creator"); }}>
                  🛠️ Quản lý bài tập
                </button>
              )}

              <button 
                className="dropdown-item" 
                onClick={handleLogout}
                style={{ color: "#ef4444" }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          </>
        )}
        <style jsx>{`
          .dropdown-item {
            width: 100%;
            padding: 12px 16px;
            text-align: left;
            border: none;
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #475569;
            transition: all 0.2s;
          }
          .dropdown-item:hover {
            background: #f1f5f9;
            padding-left: 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button
        className="button"
        style={{ 
          padding: "8px 20px", 
          borderRadius: "10px",
          fontWeight: 600,
          cursor: "pointer"
        }}
        onClick={() => router.push("/auth/login")}
      >
        Đăng nhập
      </button>
    </div>
  );
}