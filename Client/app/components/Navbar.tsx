"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthBar from "./AuthBar";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/problems", label: "Đề bài", icon: "📝" },
  { href: "/contests", label: "Cuộc thi", icon: "🏆" },
  { href: "/submissions", label: "Bài nộp", icon: "🚀" },
  { href: "/languages", label: "Ngôn ngữ", icon: "🌐" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="main-header">
      <div className="header-wrapper">
        <Link href="/" className="brand-logo">
          <div className="logo-icon">🐧</div>
          <div className="logo-text">
            <span>Kra</span>
            <span className="text-gradient">tognoek</span>
          </div>
        </Link>

        <div className="header-actions">
          <nav className="main-nav">
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="divider"></div>
          <div className="auth-section">
            <AuthBar />
          </div>
        </div>
      </div>
    </header>
  );
}