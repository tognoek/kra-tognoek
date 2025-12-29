"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Topic {
  IdChuDe: number;
  TenChuDe: string;
  MoTa: string;
}

export default function AdminTopicsPage() {
  const [data, setData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [TenChuDe, setTenChuDe] = useState("");
  const [MoTa, setMoTa] = useState("");
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/topics`, { cache: "no-store" });
      if (!res.ok) throw new Error("Không tải được danh sách chủ đề");
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
    setTenChuDe("");
    setMoTa("");
  };

  const handleEditClick = (topic: Topic) => {
    setEditingId(topic.IdChuDe);
    setTenChuDe(topic.TenChuDe);
    setMoTa(topic.MoTa || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const isUpdate = !!editingId;
      const url = isUpdate ? `${API_BASE}/api/topics/${editingId}` : `${API_BASE}/api/topics`;
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenChuDe, MoTa }),
      });

      if (!res.ok) throw new Error("Thao tác thất bại");

      toast.success(isUpdate ? "Đã cập nhật chủ đề" : "Đã thêm chủ đề mới");
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
          <h1 className="page-title">Quản trị - Chủ đề</h1>
          <p className="page-subtitle">Phân loại các bài tập theo lĩnh vực kiến thức.</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>🔄 Làm mới</button>
      </div>

      <div className="content-card mb-6">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="form-header mb-4">
            <h3 className="modal-title">{editingId ? `Chỉnh sửa Chủ đề #${editingId}` : "Tạo chủ đề mới"}</h3>
          </div>
          <div className="form-grid-sync">
            <div className="form-group" style={{flex: 1}}>
              <label className="label-sync">Tên chủ đề</label>
              <input className="input-sync" value={TenChuDe} onChange={(e) => setTenChuDe(e.target.value)} placeholder="Quy hoạch động, Đồ thị..." required />
            </div>
            <div className="form-group" style={{flex: 2}}>
              <label className="label-sync">Mô tả ngắn</label>
              <input className="input-sync" value={MoTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Mô tả tóm tắt ý nghĩa chủ đề..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-sync btn-primary-sync" disabled={submitting}>
              {submitting ? "Đang xử lý..." : (editingId ? "Cập nhật" : "Tạo mới")}
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
                <th style={{width: '250px'}}>Tên chủ đề</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center p-5">Đang tải...</td></tr>
              ) : data.map((t) => (
                <tr key={t.IdChuDe} onClick={() => handleEditClick(t)} className="hover-row-sync">
                  <td className="font-mono">#{t.IdChuDe}</td>
                  <td className="font-bold">{t.TenChuDe}</td>
                  <td className="text-gray-500">{t.MoTa || "---"}</td>
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