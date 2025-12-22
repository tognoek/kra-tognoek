"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

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
  return window.localStorage.getItem("oj_admin_token") || "";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/api/roles`),
      ]);
      if (!usersRes.ok) {
        throw new Error("Không tải được danh sách users (có thể thiếu JWT Admin).");
      }
      const [usersData, rolesData] = await Promise.all([usersRes.json(), rolesRes.json()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChangeRole = async (userId: string, newRoleId: string) => {
    try {
      setSavingId(userId);
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ IdVaiTro: newRoleId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Cập nhật vai trò thất bại");
      }
      await load();
    } catch (e: any) {
      alert(e.message || "Lỗi không xác định khi cập nhật vai trò");
    } finally {
      setSavingId(null);
    }
  };

  const onToggleStatus = async (user: AdminUser) => {
    try {
      setSavingId(user.IdTaiKhoan);
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/users/${user.IdTaiKhoan}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ TrangThai: !user.TrangThai }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Cập nhật trạng thái thất bại");
      }
      await load();
    } catch (e: any) {
      alert(e.message || "Lỗi không xác định khi cập nhật trạng thái");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <h1 className="section-title">Admin - Users</h1>
      <p className="section-sub">
        Quản lý tài khoản: vai trò và trạng thái (khoá/mở). Cần JWT token của Admin để sử dụng được API.
      </p>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "8%" }}>ID</th>
                <th style={{ width: "18%" }}>Username</th>
                <th style={{ width: "18%" }}>Họ tên</th>
                <th style={{ width: "22%" }}>Email</th>
                <th style={{ width: "14%" }}>Vai trò</th>
                <th style={{ width: "10%" }}>Trạng thái</th>
                <th style={{ width: "10%" }}>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.IdTaiKhoan}>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>#{u.IdTaiKhoan}</td>
                  <td>{u.TenDangNhap}</td>
                  <td>{u.HoTen}</td>
                  <td>{u.Email}</td>
                  <td>
                    <select
                      className="select"
                      value={
                        roles.find((r) => r.TenVaiTro === u.VaiTro)?.IdVaiTro?.toString() || ""
                      }
                      onChange={(e) => onChangeRole(u.IdTaiKhoan, e.target.value)}
                      disabled={savingId === u.IdTaiKhoan}
                    >
                      <option value="">-- chọn --</option>
                      {roles.map((r) => (
                        <option key={r.IdVaiTro} value={r.IdVaiTro.toString()}>
                          {r.TenVaiTro}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={savingId === u.IdTaiKhoan}
                      onClick={() => onToggleStatus(u)}
                    >
                      {u.TrangThai ? "Đang mở" : "Đã khoá"}
                    </button>
                  </td>
                  <td style={{ fontSize: 12, color: "#666" }}>
                    {u.NgayTao ? new Date(u.NgayTao).toLocaleDateString("vi-VN") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


