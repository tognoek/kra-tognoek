"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

// Định nghĩa kiểu dữ liệu cho Chủ Đề
interface Topic {
  IdChuDe: number;
  TenChuDe: string;
  MoTa: string;
}

export default function AdminTopicsPage() {
  const [data, setData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State (Chỉ cần Tên và Mô tả)
  const [TenChuDe, setTenChuDe] = useState("");
  const [MoTa, setMoTa] = useState("");
  
  // State quản lý chế độ sửa
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/topics`, { cache: "no-store" });
      if (!res.ok) throw new Error("Không tải được danh sách chủ đề");
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
    setTenChuDe("");
    setMoTa("");
    setError(null);
  };

  // Hàm load dữ liệu lên form khi click vào bảng
  const handleEditClick = (topic: Topic) => {
    setEditingId(topic.IdChuDe);
    setTenChuDe(topic.TenChuDe);
    setMoTa(topic.MoTa || ""); // Nếu null thì để chuỗi rỗng
    setError(null);
    
    // Cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm xử lý Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Xác định URL và Method
      const isUpdate = !!editingId;
      const url = isUpdate 
        ? `${API_BASE}/api/topics/${editingId}` 
        : `${API_BASE}/api/topics`;
      
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenChuDe, MoTa }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (isUpdate ? "Cập nhật thất bại" : "Tạo mới thất bại"));
      }

      // Thành công
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
      <h1 className="section-title">Quản trị - Chủ đề bài tập</h1>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      <form 
        onSubmit={handleSubmit} 
        className="form-card form-grid" 
        style={{ border: editingId ? "2px solid #0070f3" : "1px solid #eaeaea" }}
      >
        <div style={{ gridColumn: "1 / -1", fontWeight: "bold", marginBottom: "10px" }}>
          {editingId ? `Đang chỉnh sửa Chủ đề #${editingId}` : "Thêm chủ đề mới"}
        </div>

        <div className="form-group">
          <div className="label">Tên chủ đề <span style={{color: 'red'}}>*</span></div>
          <input
            className="input"
            value={TenChuDe}
            onChange={(e) => setTenChuDe(e.target.value)}
            placeholder="Ví dụ: Quy hoạch động"
            required
          />
        </div>

        {/* Mô tả có thể dài nên dùng input hoặc textarea tùy ý */}
        <div className="form-group">
          <div className="label">Mô tả</div>
          <input
            className="input"
            value={MoTa}
            onChange={(e) => setMoTa(e.target.value)}
            placeholder="Mô tả ngắn về chủ đề này..."
          />
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Đang xử lý..." : (editingId ? "Cập nhật thay đổi" : "Thêm chủ đề")}
          </button>
          
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
                <th style={{ width: "40%", whiteSpace: "nowrap" }}>Tên chủ đề</th>
                <th style={{ width: "50%", whiteSpace: "nowrap" }}>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr 
                  key={t.IdChuDe} 
                  onClick={() => handleEditClick(t)}
                  style={{ 
                    cursor: "pointer", 
                    backgroundColor: editingId === t.IdChuDe ? "#e6f7ff" : "transparent"
                  }}
                  className="hover-row"
                >
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>#{t.IdChuDe}</td>
                  <td style={{ fontWeight: "500" }}>{t.TenChuDe}</td>
                  <td style={{ color: "#666" }}>{t.MoTa || <i>(Không có mô tả)</i>}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                    Chưa có chủ đề nào.
                  </td>
                </tr>
              )}
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