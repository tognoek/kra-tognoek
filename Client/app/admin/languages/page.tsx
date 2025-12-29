"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Language {
  IdNgonNgu: number;
  TenNgonNgu: string;
  TenNhanDien: string;
  TrangThai: boolean;
}

export default function AdminLanguagesPage() {
  const [data, setData] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [TenNgonNgu, setTenNgonNgu] = useState("");
  const [TenNhanDien, setTenNhanDien] = useState("");
  const [TrangThai, setTrangThai] = useState(true);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/languages`, { cache: "no-store" });
      if (!res.ok) throw new Error("Không tải được danh sách ngôn ngữ");
      const d = await res.json();
      setData(d);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setTenNgonNgu("");
    setTenNhanDien("");
    setTrangThai(true);
  };

  const handleEditClick = (lang: Language) => {
    setEditingId(lang.IdNgonNgu);
    setTenNgonNgu(lang.TenNgonNgu);
    setTenNhanDien(lang.TenNhanDien);
    setTrangThai(lang.TrangThai);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const isUpdate = !!editingId;
      const url = isUpdate ? `${API_BASE}/api/languages/${editingId}` : `${API_BASE}/api/languages`;
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenNgonNgu, TenNhanDien, TrangThai }),
      });

      if (!res.ok) throw new Error(isUpdate ? "Cập nhật thất bại" : "Tạo mới thất bại");

      toast.success(isUpdate ? "Cập nhật thành công!" : "Thêm mới thành công!");
      resetForm();
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <style dangerouslySetInnerHTML={{ __html: sharedAdminStyles }} />
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Quản trị - Ngôn ngữ</h1>
          <p className="page-subtitle">Quản lý các ngôn ngữ lập trình và trình biên dịch.</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>🔄 Làm mới</button>
      </div>

      <div className="content-card mb-6">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="form-header mb-4">
            <h3 className="modal-title">{editingId ? `Chỉnh sửa Ngôn ngữ #${editingId}` : "Thêm ngôn ngữ mới"}</h3>
          </div>
          <div className="form-grid-sync">
            <div className="form-group">
              <label className="label-sync">Tên ngôn ngữ</label>
              <input className="input-sync" value={TenNgonNgu} onChange={(e) => setTenNgonNgu(e.target.value)} placeholder="C++, Python..." required />
            </div>
            <div className="form-group">
              <label className="label-sync">Tên nhận diện (ID)</label>
              <input className="input-sync" value={TenNhanDien} onChange={(e) => setTenNhanDien(e.target.value)} placeholder="cpp, py, c..." required />
            </div>
            <div className="form-group">
              <label className="label-sync">Trạng thái</label>
              <select className="input-sync" value={TrangThai ? "true" : "false"} onChange={(e) => setTrangThai(e.target.value === "true")}>
                <option value="true">Đang hoạt động</option>
                <option value="false">Ngưng hỗ trợ</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-sync btn-primary-sync" disabled={submitting}>
              {submitting ? "Đang xử lý..." : (editingId ? "Cập nhật" : "Thêm mới")}
            </button>
            {editingId && <button type="button" className="btn-sync btn-secondary-sync" onClick={resetForm}>Hủy</button>}
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{width: '80px'}}>ID</th>
                <th>Tên ngôn ngữ</th>
                <th>Nhận diện</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center p-5">Đang tải...</td></tr>
              ) : data.map((l) => (
                <tr key={l.IdNgonNgu} onClick={() => handleEditClick(l)} className="hover-row-sync">
                  <td className="font-mono">#{l.IdNgonNgu}</td>
                  <td className="font-bold">{l.TenNgonNgu}</td>
                  <td><code className="code-badge">{l.TenNhanDien}</code></td>
                  <td>
                    <span className={`status-badge ${l.TrangThai ? 'active' : 'blocked'}`}>
                      {l.TrangThai ? "Active" : "Disabled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const sharedAdminStyles = `
  .admin-page { max-width: 1200px; margin: 0 auto; padding: 30px 20px; font-family: 'Inter', system-ui, sans-serif; color: #1f2937; background-color: #f3f4f6; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .page-title { font-size: 24px; font-weight: 700; margin: 0; color: #111827; }
  .page-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
  
  .content-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }
  .mb-6 { margin-bottom: 24px; }
  .p-6 { padding: 24px; }
  .flex { display: flex; }
  .gap-2 { gap: 8px; }
  .mt-4 { margin-top: 16px; }
  
  .form-grid-sync { display: flex; gap: 16px; flex-wrap: wrap; }
  .form-group { flex: 1; min-width: 200px; }
  .label-sync { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  .input-sync { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; font-size: 14px; transition: 0.2s; }
  .input-sync:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
  
  .btn-sync { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
  .btn-primary-sync { background: #2563eb; color: white; }
  .btn-primary-sync:hover { background: #1d4ed8; }
  .btn-secondary-sync { background: #f3f4f6; color: #374151; }
  
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { background-color: #f9fafb; padding: 12px 24px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
  .data-table td { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; font-size: 14px; }
  .hover-row-sync { cursor: pointer; transition: 0.2s; }
  .hover-row-sync:hover { background-color: #f9fafb; }
  
  .font-mono { font-family: monospace; color: #6b7280; }
  .font-bold { font-weight: 600; color: #111827; }
  .text-gray-500 { color: #6b7280; }
  .code-badge { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #ef4444; }
  
  .status-badge { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .status-badge.active { background-color: #d1fae5; color: #065f46; }
  .status-badge.blocked { background-color: #fee2e2; color: #991b1b; }

  .btn-secondary { background: white; border: 1px solid #d1d5db; color: #374151; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; }
`;