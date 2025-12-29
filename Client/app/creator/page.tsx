"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function CreatorPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("oj_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch (e) {
        console.error("Parse user failed", e);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const isAdmin = user?.VaiTro?.toLowerCase() === "admin";
  const isCreator = user?.VaiTro?.toLowerCase() === "creator" || isAdmin;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="page-container">
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
        <div className="error-card">
          <div className="icon-error">🚫</div>
          <h2>Truy cập bị từ chối</h2>
          <p>Bạn cần quyền <strong>Creator</strong> hoặc <strong>Admin</strong> để truy cập khu vực này.</p>
          <button className="btn-back" onClick={() => router.push("/")}>
            ← Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1 className="welcome-title">Xin chào, {user?.HoTen || user?.TenDangNhap} 👋</h1>
          <p className="welcome-sub">Chào mừng đến với trung tâm quản lý nội dung.</p>
        </div>
        <div className="role-badge">
          {isAdmin ? "Quản trị viên (Admin)" : "Người tạo đề (Creator)"}
        </div>
      </div>

      <div className="dashboard-content">
        
        {/* Section: TẠO MỚI */}
        <h3 className="section-label">🛠️ Tác vụ nhanh</h3>
        <div className="card-grid">
          
          <div className="card action-card blue" onClick={() => router.push("/creator/problems/create")}>
            <div className="card-icon-bg">✏️</div>
            <div className="card-content">
              <h3>Tạo đề bài mới</h3>
              <p>Soạn thảo đề bài, thiết lập bộ test và cấu hình chấm điểm.</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          <div className="card action-card purple" onClick={() => router.push("/creator/contests/create")}>
            <div className="card-icon-bg">🏆</div>
            <div className="card-content">
              <h3>Tạo cuộc thi mới</h3>
              <p>Tổ chức kỳ thi, thêm đề bài và thiết lập thời gian.</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

          {/* KHỐI MỚI: TẠO BÀI ĐĂNG */}
          <div className="card action-card green-light" onClick={() => router.push("/creator/posts/create")}>
            <div className="card-icon-bg">📝</div>
            <div className="card-content">
              <h3>Tạo bài đăng</h3>
              <p>Viết thông báo, tin tức hoặc hướng dẫn mới cho người dùng.</p>
            </div>
            <div className="card-arrow">→</div>
          </div>

        </div>

        {/* Section: QUẢN LÝ */}
        <h3 className="section-label" style={{marginTop: '30px'}}>📂 Quản lý dữ liệu</h3>
        <div className="card-grid">

          <div className="card manage-card" onClick={() => router.push("/creator/problems")}>
            <div className="icon-box green">📚</div>
            <div className="card-content">
              <h3>Kho bài tập của tôi</h3>
              <p>Xem danh sách, chỉnh sửa hoặc ẩn các bài tập bạn đã tạo.</p>
            </div>
          </div>

          <div className="card manage-card" onClick={() => router.push("/creator/contests")}>
            <div className="icon-box orange">📊</div>
            <div className="card-content">
              <h3>Danh sách cuộc thi</h3>
              <p>Quản lý trạng thái, thí sinh và bảng xếp hạng các kỳ thi.</p>
            </div>
          </div>

          {/* KHỐI MỚI: DANH SÁCH BÀI ĐĂNG */}
          <div className="card manage-card" onClick={() => router.push("/creator/posts")}>
            <div className="icon-box blue-soft">📰</div>
            <div className="card-content">
              <h3>Danh sách bài đăng</h3>
              <p>Quản lý nội dung, chỉnh sửa hoặc xóa các bài viết đã đăng.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// CSS STYLES (Đã thêm màu sắc cho 2 khối mới)
// ==========================================
const cssStyles = `
  /* Global Layout */
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #333;
    min-height: 80vh;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80vh;
    color: #666;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  /* Error State */
  .error-card {
    background: white;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    margin: 60px auto;
  }

  .icon-error { font-size: 48px; margin-bottom: 16px; }
  
  .btn-back {
    margin-top: 20px;
    padding: 10px 20px;
    background: #f3f4f6;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    color: #374151;
    transition: all 0.2s;
  }
  .btn-back:hover { background: #e5e7eb; }

  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 20px;
  }

  .welcome-title {
    font-size: 28px;
    font-weight: 800;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .welcome-sub {
    color: #6b7280;
    margin: 0;
    font-size: 16px;
  }

  .role-badge {
    background: #eff6ff;
    color: #2563eb;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid #dbeafe;
  }

  /* Grid Layout */
  .section-label {
    font-size: 14px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: 0.05em;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
  }

  /* Cards */
  .card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.25s ease;
    border: 1px solid #e5e7eb;
    position: relative;
    overflow: hidden;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.1);
    border-color: transparent;
  }

  .card h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }

  .card p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
  }

  /* Action Cards */
  .action-card {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .action-card.blue:hover { border-color: #3b82f6; background: #eff6ff; }
  .action-card.purple:hover { border-color: #8b5cf6; background: #f5f3ff; }
  .action-card.green-light:hover { border-color: #10b981; background: #ecfdf5; }

  .card-icon-bg {
    font-size: 24px;
    background: white;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  .card-arrow {
    margin-left: auto;
    font-weight: bold;
    color: #d1d5db;
    transition: transform 0.2s;
  }
  
  .card:hover .card-arrow {
    transform: translateX(4px);
    color: #374151;
  }

  /* Manage Cards */
  .manage-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  
  .manage-card:hover {
    border-color: #d1d5db;
  }

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .icon-box.green { background: #dcfce7; color: #166534; }
  .icon-box.orange { background: #ffedd5; color: #9a3412; }
  .icon-box.blue-soft { background: #e0f2fe; color: #0369a1; }

  /* Mobile Responsive */
  @media (max-width: 600px) {
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
    .card-grid {
      grid-template-columns: 1fr;
    }
  }
`;