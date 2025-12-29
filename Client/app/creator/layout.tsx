"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

const creatorNav = [
  { href: "/creator", label: "Bảng điều khiển", icon: "📊" },
  { href: "/creator/problems", label: "Danh sách bài tập", icon: "📚" },
  { href: "/creator/problems/create", label: "Tạo bài tập", icon: "➕" },
  { href: "/creator/contests", label: "Danh sách cuộc thi", icon: "🏆" },
  { href: "/creator/contests/create", label: "Tạo cuộc thi", icon: "📅" },
  { href: "/creator/posts", label: "Danh sách bài đăng", icon: "📰" },
  { href: "/creator/posts/create", label: "Tạo bài đăng", icon: "📝" },
  { href: "/", label: "Về trang chủ", icon: "🏠" },
];

export default function CreateLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("oj_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch (e) {
        setUser(null);
      }
    }
      if (typeof document !== "undefined") {
        document.title = `Trang nhà sáng tạo - Kra tognoek`;
      }
    setLoading(false);
  }, []);

  const isAdmin = user?.VaiTro?.toLowerCase() === "admin";
  const isCreator = user?.VaiTro?.toLowerCase() === "creator" || isAdmin;

  if (loading) {
    return <div className="admin-loading">⌛ Đang kiểm tra quyền truy cập...</div>;
  }

  if (!isCreator) {
    return (
      <div className="admin-error-wrapper">
        <style dangerouslySetInnerHTML={{ __html: layoutStyles }} />
        <div className="admin-error-card">
          <div className="error-icon">🚫</div>
          <h2>Truy cập bị từ chối</h2>
          <p>Bạn cần quyền <b>Creator</b> để truy cập khu vực này.</p>
          <Link href="/" className="back-home-btn">← Quay về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-container">
      <style dangerouslySetInnerHTML={{ __html: layoutStyles }} />
      
      {/* Sidebar đồng bộ style Admin */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-badge creator-badge">{user?.VaiTro?.toUpperCase()} PANEL</span>
        </div>
        
        <nav className="sidebar-menu">
          {creatorNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`sidebar-link ${isActive ? "active-panel" : ""}`}
              >
                <span className="link-icon">{item.icon}</span>
                <span className="link-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <header className="content-header">
          <div>
            <h1 className="content-title">
              {creatorNav.find(n => n.href === pathname)?.label || "Quản trị nội dung"}
            </h1>
            <div className="breadcrumb">Hệ thống / Creator / {creatorNav.find(n => n.href === pathname)?.label}</div>
          </div>
          <div className="admin-profile">
            <div className="admin-info">
              <span className="admin-name">{user?.HoTen}</span>
              <span className="admin-role">Content Creator</span>
            </div>
            <div className="admin-avatar">C</div>
          </div>
        </header>

        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
}

const layoutStyles = `
  .admin-layout-container {
    display: flex;
    gap: 30px;
    padding: 20px 0;
    min-height: 85vh;
    font-family: 'Inter', system-ui, sans-serif;
  }

  /* Sidebar */
  .admin-sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 24px;
    padding: 30px 20px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .sidebar-brand {
    margin-bottom: 40px;
    text-align: center;
  }

  .creator-badge {
    background: #e0f2fe;
    color: #0369a1;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 1.5px;
    border: 1px solid #bae6fd;
  }

  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    border-radius: 16px;
    color: #475569;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-link:hover {
    background: #f8fafc;
    color: #1e293b;
    transform: translateX(5px);
  }

  .sidebar-link.active-panel {
    background: #1e293b;
    color: #ffffff;
    box-shadow: 0 10px 15px -3px rgba(30, 41, 59, 0.3);
  }

  .sidebar-footer {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
  }

  .exit-link {
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .exit-link:hover { color: #1e293b; }

  /* Content Area */
  .admin-main-content {
    flex: 1;
    background: #ffffff;
    border-radius: 32px;
    padding: 40px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  .content-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 5px 0;
  }

  .breadcrumb {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }

  .admin-profile {
    display: flex;
    align-items: center;
    gap: 15px;
    background: #f8fafc;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid #f1f5f9;
  }

  .admin-info {
    display: flex;
    flex-direction: column;
    text-align: right;
  }

  .admin-name {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .admin-role {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
  }

  .admin-avatar {
    width: 38px;
    height: 38px;
    background: #0ea5e9;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-weight: 800;
  }

  /* Error & Loading Styles */
  .admin-loading { padding: 40px; text-align: center; color: #64748b; font-weight: 600; }
  .admin-error-wrapper { display: flex; justify-content: center; padding: 80px 0; }
  .admin-error-card { background: white; padding: 50px; border-radius: 32px; text-align: center; max-width: 450px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; }
  .error-icon { font-size: 60px; margin-bottom: 25px; }
  .back-home-btn { display: inline-block; margin-top: 30px; padding: 14px 28px; background: #0f172a; color: white; text-decoration: none; border-radius: 16px; font-weight: 700; transition: 0.3s; }

  @media (max-width: 1100px) {
    .admin-layout-container { flex-direction: column; }
    .admin-sidebar { width: 100%; }
    .sidebar-menu { flex-direction: row; overflow-x: auto; padding-bottom: 10px; }
    .sidebar-link { white-space: nowrap; }
    .admin-profile { display: none; }
  }
`;