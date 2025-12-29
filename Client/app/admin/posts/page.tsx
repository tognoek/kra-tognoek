"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface AdminPost {
  IdBaiDang: string;
  TieuDe: string;
  HoTen: string; // Tên người đăng
  UuTien: number;
  TrangThai: boolean;
  NgayTao: string;
}

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("oj_token") || "";
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = getToken();
      // Sử dụng API manage dành cho Admin/Creator đã thiết kế trước đó
      const res = await fetch(`${API_BASE}/api/posts/manage?role=admin`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Không tải được danh sách bài đăng.");
      const data = await res.json();
      setPosts(data);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Thay đổi độ ưu tiên nhanh
  const onChangePriority = async (postId: string, newPriority: string) => {
    const promise = async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ UuTien: newPriority, role: "admin" }),
      });
      if (!res.ok) throw new Error("Lỗi server");
      await loadPosts();
    };

    toast.promise(promise(), {
      pending: 'Đang cập nhật độ ưu tiên...',
      success: 'Đã cập nhật độ ưu tiên!',
      error: 'Cập nhật thất bại'
    });
  };

  const confirmToggleStatus = async () => {
    if (!selectedPost) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/posts/${selectedPost.IdBaiDang}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ TrangThai: !selectedPost.TrangThai }),
      });

      if (!res.ok) throw new Error("Thất bại");
      toast.success(`Đã ${selectedPost.TrangThai ? "ẩn" : "hiện"} bài đăng thành công`);
      setModalOpen(false);
      await loadPosts();
    } catch (e: any) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const filteredPosts = posts.filter(p =>
    p.TieuDe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.HoTen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Bài đăng</h1>
          <p className="page-subtitle">Điều chỉnh độ ưu tiên và hiển thị thông báo hệ thống.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadPosts} disabled={loading}>
          🔄 Làm mới
        </button>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết hoặc tác giả..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="user-count">
            <strong>{filteredPosts.length}</strong> bài viết
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề bài đăng</th>
                <th>Tác giả</th>
                <th style={{width: '150px'}}>Độ ưu tiên</th>
                <th>Trạng thái</th>
                <th style={{textAlign: 'right'}}>Ngày đăng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center p-5">Đang tải...</td></tr>
              ) : filteredPosts.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-5 text-gray-500">Không có bài đăng nào.</td></tr>
              ) : (
                filteredPosts.map((p) => (
                  <tr key={p.IdBaiDang}>
                    <td>
                      <div className="post-title-cell">
                        {p.UuTien >= 8 && <span className="hot-tag">HOT</span>}
                        <span className="main-title">{p.TieuDe}</span>
                      </div>
                    </td>
                    <td><span className="author-name">{p.HoTen}</span></td>
                    <td>
                      <select
                        className="priority-select"
                        value={p.UuTien}
                        onChange={(e) => onChangePriority(p.IdBaiDang, e.target.value)}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>Mức {i + 1}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`status-badge ${p.TrangThai ? 'active' : 'blocked'}`}
                        onClick={() => { setSelectedPost(p); setModalOpen(true); }}
                      >
                        {p.TrangThai ? "Công khai" : "Đang ẩn"}
                      </button>
                    </td>
                    <td style={{textAlign: 'right', color: '#6b7280', fontSize: '13px'}}>
                       {new Date(p.NgayTao).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XÁC NHẬN ẨN/HIỆN */}
      {modalOpen && selectedPost && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedPost.TrangThai ? "Ẩn bài viết?" : "Hiện bài viết?"}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn {selectedPost.TrangThai ? "tạm ẩn" : "công khai lại"} bài viết <strong>{selectedPost.TieuDe}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className={`btn ${selectedPost.TrangThai ? "btn-danger" : "btn-success"}`} onClick={confirmToggleStatus}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cssStyles = `
  .admin-page { max-width: 1200px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', system-ui, sans-serif; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
  .page-subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }
  
  .content-card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }
  .toolbar { padding: 20px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
  
  .search-box { position: relative; width: 350px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .search-box input { width: 100%; padding: 10px 10px 10px 38px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; font-size: 14px; }
  
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { background: #f9fafb; padding: 14px 20px; text-align: left; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
  .data-table td { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
  
  .post-title-cell { display: flex; align-items: center; gap: 8px; }
  .hot-tag { background: #fee2e2; color: #ef4444; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
  .main-title { font-weight: 600; color: #111827; }
  .author-name { color: #2563eb; font-weight: 500; font-size: 14px; }
  
  .priority-select { padding: 6px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 13px; width: 100%; }
  
  .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; }
  .status-badge.active { background: #dcfce7; color: #166534; }
  .status-badge.blocked { background: #f3f4f6; color: #6b7280; }

  .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; font-size: 14px; }
  .btn-secondary { background: #f3f4f6; color: #374151; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-success { background: #10b981; color: white; }

  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background: white; padding: 24px; border-radius: 16px; width: 400px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  .modal-close { font-size: 24px; cursor: pointer; border: none; background: none; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
`;