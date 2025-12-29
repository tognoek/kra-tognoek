import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="admin-container">
      {/* Nhúng CSS */}
      <style dangerouslySetInnerHTML={{ __html: adminStyles }} />

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Quản trị Hệ thống</h1>
          <p className="page-subtitle">
            Trung tâm kiểm soát người dùng, cấu hình và dữ liệu hệ thống.
          </p>
        </div>
        <div className="admin-badge">Admin Control Panel</div>
      </div>

      {/* Grid Menu */}
      <div className="admin-grid">
        
        {/* Card: Users */}
        <Link href="/admin/users" className="admin-card blue-theme">
          <div className="card-top">
            <div className="icon-box">👤</div>
            <div className="arrow-icon">→</div>
          </div>
          <h3 className="card-title">Quản lý Người dùng</h3>
          <p className="card-desc">
            Danh sách tài khoản, phân quyền (Admin/Creator/User) và khóa truy cập.
          </p>
        </Link>

        {/* Card: Languages */}
        <Link href="/admin/languages" className="admin-card purple-theme">
          <div className="card-top">
            <div className="icon-box">💻</div>
            <div className="arrow-icon">→</div>
          </div>
          <h3 className="card-title">Ngôn ngữ Lập trình</h3>
          <p className="card-desc">
            Cấu hình các ngôn ngữ hỗ trợ (C++, Java, Python...) và trình biên dịch.
          </p>
        </Link>

        {/* Card: Topics */}
        <Link href="/admin/topics" className="admin-card orange-theme">
          <div className="card-top">
            <div className="icon-box">🏷️</div>
            <div className="arrow-icon">→</div>
          </div>
          <h3 className="card-title">Chủ đề bài tập</h3>
          <p className="card-desc">
            Tạo và quản lý các thẻ chủ đề (Tags) để phân loại bài tập trên hệ thống.
          </p>
        </Link>

        <Link href="/admin/posts" className="admin-card green-theme">
          <div className="card-top">
            <div className="icon-box">🗂️</div>
            <div className="arrow-icon">→</div>
          </div>
          <h3 className="card-title">Danh sách bài đăng</h3>
          <p className="card-desc">
            Quản lý nội dung, trạng thái hiển thị và mức độ ưu tiên của các bài đăng hệ thống.
          </p>
        </Link>

      </div>
    </div>
  );
}

// ========================================================
// CSS STYLES
// ========================================================
const adminStyles = `
  /* Layout cơ bản */
  .admin-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #333;
  }

  /* Header */
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 15px;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 20px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 800;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .page-subtitle {
    margin: 0;
    color: #6b7280;
    font-size: 16px;
  }

  .admin-badge {
    background-color: #1f2937;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Grid Layout */
  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  /* Cards */
  .admin-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px;
    text-decoration: none;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .admin-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
  }

  /* Green Theme (Posts - Thẻ thứ 4) */
  .green-theme .icon-box {
    background-color: #f0fdf4; /* Xanh lá siêu nhạt */
    color: #16a34a;           /* Xanh lá đậm */
  }
  
  .green-theme:hover { 
    border-color: #22c55e;    /* Màu viền khi hover */
    background-color: #fcfdfc; /* Hiệu ứng nền nhẹ khi hover */
  }

  /* Đảm bảo icon box cũng đổi màu nhẹ khi hover card (Tùy chọn) */
  .green-theme:hover .icon-box {
    background-color: #dcfce7;
  }

  /* Card Top Section (Icon + Arrow) */
  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .icon-box {
    width: 54px;
    height: 54px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
  }

  .arrow-icon {
    font-size: 20px;
    color: #d1d5db;
    transition: transform 0.3s, color 0.3s;
    font-weight: bold;
  }

  .admin-card:hover .arrow-icon {
    transform: translateX(5px);
    color: #374151;
  }

  /* Content */
  .card-title {
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  .card-desc {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
  }

  /* Themes (Màu sắc riêng cho từng card) */
  /* Blue Theme (Users) */
  .blue-theme .icon-box {
    background-color: #eff6ff;
    color: #2563eb;
  }
  .blue-theme:hover { border-color: #3b82f6; }

  /* Purple Theme (Languages) */
  .purple-theme .icon-box {
    background-color: #f5f3ff;
    color: #7c3aed;
  }
  .purple-theme:hover { border-color: #8b5cf6; }

  /* Orange Theme (Topics) */
  .orange-theme .icon-box {
    background-color: #fff7ed;
    color: #ea580c;
  }
  .orange-theme:hover { border-color: #f97316; }

  /* Responsive */
  @media (max-width: 600px) {
    .admin-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;