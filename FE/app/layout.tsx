import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import AuthBar from "./components/AuthBar";

const nav = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
  { href: "/contests", label: "Contests" },
  { href: "/submissions", label: "Submissions" },
  { href: "/languages", label: "Languages" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
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

