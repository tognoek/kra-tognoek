import Link from "next/link";

const cards = [
  { title: "📚 Problems", href: "/problems", desc: "Xem và giải các đề bài lập trình", icon: "📚" },
  { title: "🏆 Contests", href: "/contests", desc: "Tham gia các cuộc thi lập trình", icon: "🏆" },
  { title: "📝 Submissions", href: "/submissions", desc: "Nộp bài và xem kết quả chấm", icon: "📝" },
  { title: "💻 Languages", href: "/languages", desc: "Xem các ngôn ngữ lập trình được hỗ trợ", icon: "💻" },
];

export default function Home() {
  return (
    <div>
      <h1 className="section-title">Online Judge Portal</h1>
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
          <div className="stat-label">Total Problems</div>
          <div className="stat-value">-</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Contests</div>
          <div className="stat-value">-</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Submissions</div>
          <div className="stat-value">-</div>
        </div>
      </div>
    </div>
  );
}

