"use client";

import { useEffect } from "react";
import Link from "next/link";

const cards = [
  { title: "📚 Đề bài", href: "/problems", desc: "Xem và giải các đề bài lập trình", icon: "📚" },
  { title: "🏆 Cuộc thi", href: "/contests", desc: "Tham gia các cuộc thi lập trình", icon: "🏆" },
  { title: "📝 Bài nộp", href: "/submissions", desc: "Nộp bài và xem kết quả chấm", icon: "📝" },
  { title: "💻 Ngôn ngữ", href: "/languages", desc: "Xem các ngôn ngữ lập trình được hỗ trợ", icon: "💻" },
  { title: "🔐 Đăng nhập", href: "/auth/login", desc: "Đăng nhập / Đăng ký tài khoản", icon: "🔐" },
];

export default function Home() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "OJ Portal - Hệ thống chấm bài tự động";
    }
  }, []);

  return (
    <div>
      <h1 className="section-title">Cổng thông tin chấm bài tự động</h1>
      <p className="section-sub">Hệ thống chấm bài tự động - Nơi bạn có thể luyện tập và thi đấu lập trình</p>

      <div className="card-grid">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card">
            <div className="card-title">{c.title}</div>
            <div className="card-desc">{c.desc}</div>
          </Link>
        ))}
      </div>

      <div className="stats-grid" style={{ marginTop: "40px" }}>
        <div className="stat-card">
          <div className="stat-label">Tổng số đề bài</div>
          <div className="stat-value">-</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cuộc thi đang diễn ra</div>
          <div className="stat-value">-</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Số bài nộp</div>
          <div className="stat-value">-</div>
        </div>
      </div>

    </div>
  );
}

