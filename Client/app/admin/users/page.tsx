"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  
  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Popup xác nhận (Modal)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error("Bạn chưa đăng nhập.");

      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/api/roles`),
      ]);

      if (!usersRes.ok) throw new Error("Không tải được danh sách users.");
      
      const [usersData, rolesData] = await Promise.all([usersRes.json(), rolesRes.json()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --- HANDLERS ---

  // 1. Thay đổi vai trò
  const onChangeRole = async (userId: string, newRoleId: string) => {
    // Với đổi Role, ta dùng toast promise cho nhanh gọn
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

  // 2. Mở Popup xác nhận khóa/mở
  const handleOpenModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // 3. Thực hiện hành động Khóa/Mở (được gọi từ Modal)
  const confirmToggleStatus = async () => {
    if (!selectedUser) return;
    
    try {
      setSavingId(selectedUser.IdTaiKhoan);
      handleCloseModal(); // Đóng modal trước khi gọi API

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

  // Filter
  const filteredUsers = users.filter(u => 
    u.TenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.HoTen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper
  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : "?";
  const getRandomColor = (char: string) => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
    return colors[char.charCodeAt(0) % colors.length];
  };

  return (
    <div className="admin-page">
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <ToastContainer position="top-right" autoClose={2000} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Người dùng</h1>
          <p className="page-subtitle">Kiểm soát truy cập và phân quyền hệ thống.</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          🔄 Làm mới
        </button>
      </div>

      {/* CARD */}
      <div className="content-card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm thành viên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="user-count">
            <strong>{filteredUsers.length}</strong> user
          </div>
        </div>

        {/* Table */}
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
                <tr><td colSpan={6} className="text-center p-5">Đang tải...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-5 text-gray-500">Không tìm thấy dữ liệu.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.IdTaiKhoan}>
                    <td>
                      <div className="avatar" style={{backgroundColor: getRandomColor(u.TenDangNhap)}}>
                        {getInitials(u.TenDangNhap)}
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
                          onClick={() => handleOpenModal(u)} // Mở Modal thay vì confirm
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
      </div>

      {/* --- CUSTOM POPUP (MODAL) --- */}
      {modalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedUser.TrangThai ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn thay đổi trạng thái của tài khoản <strong>{selectedUser.TenDangNhap}</strong>?</p>
              {selectedUser.TrangThai && (
                <p className="warning-text">⚠️ Tài khoản này sẽ không thể đăng nhập sau khi bị khóa.</p>
              )}
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

// ==========================================
// CSS STYLES (Đã thêm phần Modal)
// ==========================================
const cssStyles = `
  /* ... Giữ lại các style cũ của layout/table ... */
  .admin-page { max-width: 1200px; margin: 0 auto; padding: 30px 20px; font-family: system-ui, sans-serif; color: #1f2937; background-color: #f3f4f6; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: 700; margin: 0; color: #111827; }
  .page-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
  
  .content-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }
  
  .toolbar { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background-color: #fff; gap: 12px; }
  .search-box { position: relative; width: 300px; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 14px; }
  .search-box input { width: 100%; padding: 9px 12px 9px 32px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; }
  .search-box input:focus { border-color: #3b82f6; }

  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { background-color: #f9fafb; padding: 12px 24px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
  .data-table td { padding: 14px 24px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
  .data-table tr:hover { background-color: #f9fafb; }

  .avatar { width: 36px; height: 36px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
  .user-info { display: flex; flex-direction: column; }
  .user-name { font-weight: 600; color: #111827; font-size: 14px; }
  .user-fullname { font-size: 12px; color: #6b7280; }
  .user-email { font-family: monospace; color: #4b5563; font-size: 13px; }

  .role-select { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; cursor: pointer; }
  
  .status-badge { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: none; cursor: pointer; transition: all 0.2s; }
  .status-badge.active { background-color: #d1fae5; color: #065f46; }
  .status-badge.blocked { background-color: #fee2e2; color: #991b1b; }

  .btn { padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: 0.2s; }
  .btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; }
  .btn-secondary:hover { background: #f9fafb; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-danger:hover { background: #dc2626; }
  .btn-success { background: #10b981; color: white; }
  .btn-success:hover { background: #059669; }

  /* --- MODAL STYLES --- */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex; justify-content: center; align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    animation: slideUp 0.3s ease-out;
  }

  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .modal-title { margin: 0; font-size: 18px; font-weight: 700; color: #111827; }
  .modal-close { background: none; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; }
  
  .modal-body { margin-bottom: 24px; font-size: 14px; color: #4b5563; line-height: 1.5; }
  .warning-text { color: #dc2626; margin-top: 8px; font-size: 13px; background: #fee2e2; padding: 8px; border-radius: 6px; }

  .modal-footer { display: flex; justify-content: flex-end; gap: 12px; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;