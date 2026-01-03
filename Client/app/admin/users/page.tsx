"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CryptoJS from "crypto-js";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

// --- INTERFACES ---
interface AdminUser {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  TrangThai: boolean;
  NgayTao: string;
  VaiTro: string;
}

interface Role {
  IdVaiTro: string | number;
  TenVaiTro: string;
}

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("oj_token") || "";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // --- PHÂN TRANG STATE ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  const getAvatarUrl = (email: string) => {
    const address = String(email || "default").trim().toLowerCase();
    const hash = CryptoJS.MD5(address).toString();
    return `https://www.gravatar.com/avatar/${hash}?s=80&d=identicon`;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error("Bạn chưa đăng nhập.");

      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        q: searchTerm
      });

      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/roles`),
      ]);

      if (!usersRes.ok) throw new Error("Không tải được danh sách users.");
      
      const [usersData, rolesData] = await Promise.all([usersRes.json(), rolesRes.json()]);
      
      // Hỗ trợ cả 2 trường hợp: API trả về mảng trực tiếp hoặc trả về object phân trang
      if (usersData.users) {
        setUsers(usersData.users);
        setTotalPages(usersData.totalPages || 1);
        setTotalUsers(usersData.total || 0);
      } else {
        setUsers(usersData);
      }
      setRoles(rolesData);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [load]);

  const onChangeRole = async (userId: string, newRoleId: string) => {
    const promise = async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ IdVaiTro: newRoleId }),
      });
      if (!res.ok) throw new Error("Lỗi server");
      await load();
    };

    toast.promise(promise(), {
      pending: 'Đang cập nhật vai trò...',
      success: 'Đã thay đổi vai trò thành công!',
      error: 'Cập nhật thất bại'
    });
  };

  const handleOpenModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      setSavingId(selectedUser.IdTaiKhoan);
      handleCloseModal();
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser.IdTaiKhoan}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ TrangThai: !selectedUser.TrangThai }),
      });
      if (!res.ok) throw new Error("Thất bại");
      toast.success(`Đã ${selectedUser.TrangThai ? "khóa" : "mở khóa"} tài khoản ${selectedUser.TenDangNhap}`);
      await load();
    } catch (e: any) {
      toast.error("Cập nhật trạng thái thất bại");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Người dùng</h1>
          <p className="page-subtitle">Kiểm soát truy cập và phân quyền hệ thống.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => {setPage(1); load();}} disabled={loading}>
          🔄 Làm mới
        </button>
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm thành viên..." 
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setPage(1);}}
            />
          </div>
          <div className="user-count">
            Tổng số: <strong>{totalUsers}</strong> thành viên
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '60px'}}>Avatar</th>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th style={{textAlign: 'right'}}>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-5">Đang tải dữ liệu...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-5 text-gray-500">Không tìm thấy dữ liệu.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.IdTaiKhoan}>
                    <td>
                      <div className="avatar-box">
                        <img src={getAvatarUrl(u.Email)} alt="avatar" className="avatar-img" />
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">{u.TenDangNhap}</span>
                        <span className="user-fullname">{u.HoTen}</span>
                      </div>
                    </td>
                    <td><span className="user-email">{u.Email}</span></td>
                    <td>
                      <select
                        className="role-select"
                        value={roles.find((r) => r.TenVaiTro === u.VaiTro)?.IdVaiTro?.toString() || ""}
                        onChange={(e) => onChangeRole(u.IdTaiKhoan, e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r.IdVaiTro} value={r.IdVaiTro.toString()}>{r.TenVaiTro}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                        <button
                          type="button"
                          className={`status-badge ${u.TrangThai ? 'active' : 'blocked'}`}
                          disabled={savingId === u.IdTaiKhoan}
                          onClick={() => handleOpenModal(u)}
                        >
                          {u.TrangThai ? "Active" : "Locked"}
                        </button>
                    </td>
                    <td style={{textAlign: 'right', color: '#6b7280', fontSize: '13px'}}>
                       {new Date(u.NgayTao).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- UI PHÂN TRANG --- */}
        <div className="pagination-bar">
          <div className="pagination-info">
            Trang <strong>{page}</strong> / {totalPages}
          </div>
          <div className="pagination-actions">
            <button 
              className="btn btn-nav" 
              disabled={page <= 1 || loading} 
              onClick={() => setPage(p => p - 1)}
            >
              &laquo; Trước
            </button>
            <button 
              className="btn btn-nav" 
              disabled={page >= totalPages || loading} 
              onClick={() => setPage(p => p + 1)}
            >
              Sau &raquo;
            </button>
          </div>
        </div>
      </div>

      {modalOpen && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedUser.TrangThai ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-user-preview">
                <img src={getAvatarUrl(selectedUser.Email)} alt="user" className="modal-avatar" />
                <div>
                    <strong>{selectedUser.HoTen}</strong>
                    <div style={{fontSize: '12px', color: '#666'}}>@{selectedUser.TenDangNhap}</div>
                </div>
              </div>
              <p>Bạn có chắc chắn muốn {selectedUser.TrangThai ? "khóa" : "mở khóa"} tài khoản này?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>Hủy bỏ</button>
              <button 
                className={`btn ${selectedUser.TrangThai ? "btn-danger" : "btn-success"}`}
                onClick={confirmToggleStatus}
              >
                {selectedUser.TrangThai ? "Xác nhận Khóa" : "Xác nhận Mở"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cssStyles = `
  .admin-page { max-width: 1200px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', sans-serif; color: #1f2937; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: 800; margin: 0; color: #111827; }
  .page-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
  .content-card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; overflow: hidden; }
  .toolbar { padding: 20px 24px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
  .search-box { position: relative; width: 320px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .search-box input { width: 100%; padding: 10px 12px 10px 38px; border: 1px solid #e5e7eb; border-radius: 10px; outline: none; font-size: 14px; }
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { background-color: #f9fafb; padding: 14px 24px; text-align: left; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
  .data-table td { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  .avatar-box { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; }
  .user-info { display: flex; flex-direction: column; }
  .user-name { font-weight: 700; color: #111827; font-size: 14px; }
  .user-fullname { font-size: 12px; color: #6b7280; }
  .role-select { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; }
  .status-badge { padding: 6px 14px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: none; cursor: pointer; }
  .status-badge.active { background-color: #dcfce7; color: #166534; }
  .status-badge.blocked { background-color: #fee2e2; color: #991b1b; }
  .btn { padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
  .btn-secondary { background: white; border: 1px solid #e5e7eb; color: #374151; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-success { background: #10b981; color: white; }

  /* PAGINATION STYLES */
  .pagination-bar { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
  .pagination-info { font-size: 14px; color: #6b7280; }
  .pagination-actions { display: flex; gap: 8px; }
  .btn-nav { background: white; border: 1px solid #e5e7eb; color: #374151; padding: 6px 14px; font-size: 13px; }
  .btn-nav:hover:not(:disabled) { background: #f3f4f6; }
  .btn-nav:disabled { opacity: 0.5; cursor: not-allowed; }

  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background: white; padding: 32px; border-radius: 20px; width: 100%; max-width: 420px; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .modal-user-preview { display: flex; align-items: center; gap: 14px; padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e5e7eb; }
  .modal-avatar { width: 44px; height: 44px; border-radius: 10px; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
`;