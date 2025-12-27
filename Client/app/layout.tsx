import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import AuthBar from "./components/AuthBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OJ Portal - Hệ thống chấm bài tự động",
  description: "Hệ thống chấm bài tự động - Nơi bạn có thể luyện tập và thi đấu lập trình",
  icons: {
    icon: "/favicon.ico",
  },
};

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/problems", label: "Đề bài" },
  { href: "/contests", label: "Cuộc thi" },
  { href: "/submissions", label: "Bài nộp" },
  { href: "/languages", label: "Ngôn ngữ" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <header className="header">
          <div className="header-content">
            <Link href="/" className="logo">
              <span>⚡</span>
              <span>OJ Portal</span>
            </Link>
            <div className="header-right">
              <nav className="nav">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className="nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <AuthBar />
            </div>
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}

