"use client"; // Cần thiết để sử dụng usePathname

import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AuthBar from "./components/AuthBar";

const navLinks = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/problems", label: "Đề bài", icon: "📝" },
  { href: "/contests", label: "Cuộc thi", icon: "🏆" },
  { href: "/submissions", label: "Bài nộp", icon: "🚀" },
  { href: "/languages", label: "Ngôn ngữ", icon: "🌐" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <div className="app-container">
          <header className="main-header">
            <div className="header-wrapper">
              {/* Logo Side */}
              <Link href="/" className="brand-logo">
                <div className="logo-icon">🐧</div>
                <div className="logo-text">
                  <span>Kra</span>
                  <span className="text-gradient">tognoek</span>
                </div>
              </Link>

              {/* Navigation Side */}
              <div className="header-actions">
                <nav className="main-nav">
                  {navLinks.map((item) => {
                    // Kiểm tra xem link có đang active không
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

          <main className="content-area">
            <div className="container">
              {children}
            </div>
          </main>

          <footer className="main-footer">
            <p>© 2025 Kra tognoek. Built for Competitive Programming.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}