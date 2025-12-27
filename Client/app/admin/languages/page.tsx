"use client";

import { useEffect, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [TenNgonNgu, setTenNgonNgu] = useState("");
  const [TenNhanDien, setTenNhanDien] = useState("");
  const [TrangThai, setTrangThai] = useState(true);
  
  // State quản lý chế độ sửa
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/languages`, { cache: "no-store" });
      if (!res.ok) throw new Error("Không tải được danh sách ngôn ngữ");
      const d = await res.json();
      setData(d);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Hàm Reset form về trạng thái thêm mới
  const resetForm = () => {
    setEditingId(null);
    setTenNgonNgu("");
    setTenNhanDien("");
    setTrangThai(true);
    setError(null);
  };

  // Hàm load dữ liệu lên form khi click vào bảng
  const handleEditClick = (lang: Language) => {
    setEditingId(lang.IdNgonNgu);
    setTenNgonNgu(lang.TenNgonNgu);
    setTenNhanDien(lang.TenNhanDien);
    setTrangThai(lang.TrangThai);
    setError(null);
    
    // Cuộn lên đầu trang (nếu danh sách dài)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm xử lý chung cho cả Tạo mới và Cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Nếu có editingId -> Dùng PUT, ngược lại -> Dùng POST
      const isUpdate = !!editingId;
      const url = isUpdate 
        ? `${API_BASE}/api/languages/${editingId}` 
        : `${API_BASE}/api/languages`;
      
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenNgonNgu, TenNhanDien, TrangThai }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (isUpdate ? "Cập nhật thất bại" : "Tạo mới thất bại"));
      }

      // Thành công -> Reset form và load lại bảng
      resetForm();
      await load();
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">Quản trị - Ngôn ngữ</h1>
      <p className="section-sub">Quản lý các ngôn ngữ lập trình được hỗ trợ.</p>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      <form onSubmit={handleSubmit} className="form-card form-grid" style={{ border: editingId ? "2px solid #0070f3" : "1px solid #eaeaea" }}>
        <div style={{ gridColumn: "1 / -1", fontWeight: "bold", marginBottom: "10px" }}>
          {editingId ? `Đang chỉnh sửa ID #${editingId}` : "Thêm ngôn ngữ mới"}
        </div>

        <div className="form-group">
          <div className="label">Tên ngôn ngữ</div>
          <input
            className="input"
            value={TenNgonNgu}
            onChange={(e) => setTenNgonNgu(e.target.value)}
            placeholder="Ví dụ: C++, Python"
            required
          />
        </div>
        <div className="form-group">
          <div className="label">Tên nhận diện</div>
          <input
            className="input"
            value={TenNhanDien}
            onChange={(e) => setTenNhanDien(e.target.value)}
            placeholder="Ví dụ: cpp, c, py"
            required
          />
        </div>
        <div className="form-group">
          <div className="label">Trạng thái</div>
          <select
            className="select"
            value={TrangThai ? "true" : "false"}
            onChange={(e) => setTrangThai(e.target.value === "true")}
          >
            <option value="true">Đang dùng</option>
            <option value="false">Tắt</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Đang xử lý..." : (editingId ? "Cập nhật thay đổi" : "Thêm ngôn ngữ")}
          </button>
          
          {/* Nút hủy chỉ hiện khi đang sửa */}
          {editingId && (
            <button 
              type="button" 
              className="button" 
              style={{ backgroundColor: "#888" }}
              onClick={resetForm}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 20 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "10%", whiteSpace: "nowrap" }}>ID</th>
                <th style={{ width: "30%", whiteSpace: "nowrap" }}>Tên ngôn ngữ</th>
                <th style={{ width: "30%", whiteSpace: "nowrap" }}>Tên nhận diện</th>
                <th style={{ width: "30%", whiteSpace: "nowrap" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr 
                  key={l.IdNgonNgu} 
                  onClick={() => handleEditClick(l)}
                  style={{ 
                    cursor: "pointer", 
                    backgroundColor: editingId === l.IdNgonNgu ? "#e6f7ff" : "transparent" // Highlight dòng đang sửa
                  }}
                  className="hover-row" // Bạn có thể thêm class CSS hover nếu muốn
                >
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>#{l.IdNgonNgu}</td>
                  <td>{l.TenNgonNgu}</td>
                  <td>{l.TenNhanDien}</td>
                  <td>
                    <span style={{ 
                      color: l.TrangThai ? "green" : "red",
                      fontWeight: "bold",
                      fontSize: "12px"
                    }}>
                      {l.TrangThai ? "● Đang dùng" : "○ Tắt"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px", fontStyle: "italic" }}>
            * Click vào một dòng để chỉnh sửa thông tin.
          </p>
        </div>
      )}
    </div>
  );
}