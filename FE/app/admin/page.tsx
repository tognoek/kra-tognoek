import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="section-title">Admin Dashboard</h1>
      <p className="section-sub">
        Khu vực quản trị: quản lý người dùng, vai trò và các ngôn ngữ lập trình.
      </p>

      <div className="card-grid">
        <Link
          href="/admin/users"
          className="card"
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <div className="card-title">👤 Users</div>
          <p className="card-desc">
            Xem danh sách tài khoản, đổi vai trò (Admin/User), bật/tắt trạng thái tài khoản.
          </p>
        </Link>
        <Link
          href="/admin/languages"
          className="card"
          style={{ textDecoration: "none", cursor: "pointer" }}
        >
          <div className="card-title">💻 Languages</div>
          <p className="card-desc">
            Quản lý các ngôn ngữ lập trình được hỗ trợ trên hệ thống Online Judge.
          </p>
        </Link>
      </div>
    </div>
  );
}
