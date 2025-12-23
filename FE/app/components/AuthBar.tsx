"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";

interface User {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function AuthBar() {
  const [open, setOpen] = useState(false);
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

    // Listen for storage changes (when user logs in from another tab)
    const handleStorageChange = () => {
      updateUser();
    };

    // Listen for custom auth events (when user logs in from same tab)
    const handleAuthChange = () => {
      updateUser();
    };

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

  const handleProfileClick = () => {
    setShowDropdown(false);
    router.push("/profile");
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 500
          }}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          👤 {user.TenDangNhap}
        </button>
        {showDropdown && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998,
              }}
              onClick={() => setShowDropdown(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                minWidth: "200px",
                zIndex: 999,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e0e0e0" }}>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{user.HoTen}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{user.Email}</div>
                <div style={{ fontSize: "12px", color: "#667eea", marginTop: "4px", fontWeight: 600 }}>
                  Vai trò: {user.VaiTro}
                </div>
              </div>
              <button
                onClick={handleProfileClick}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                👤 Hồ sơ bản thân
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/admin");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  🛡️ Trang Admin
                </button>
              )}
              {isCreator && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/creator");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    border: "none",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  🛠️ Chức năng
                </button>
              )}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  border: "none",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#c62828",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ffebee")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                🚪 Đăng xuất
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button
        className="button"
        style={{ padding: "8px 14px", borderRadius: "10px" }}
        onClick={() => setOpen(true)}
      >
        Đăng nhập
      </button>
      <AuthModal 
        open={open} 
        mode="login" 
        onClose={() => {
          setOpen(false);
          updateUser();
        }} 
      />
    </div>
  );
}



