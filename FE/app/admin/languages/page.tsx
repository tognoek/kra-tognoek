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

  const [TenNgonNgu, setTenNgonNgu] = useState("");
  const [TenNhanDien, setTenNhanDien] = useState("");
  const [TrangThai, setTrangThai] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/languages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenNgonNgu, TenNhanDien, TrangThai }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Tạo ngôn ngữ thất bại");
      }
      setTenNgonNgu("");
      setTenNhanDien("");
      setTrangThai(true);
      await load();
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định khi tạo ngôn ngữ");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">Quản trị - Ngôn ngữ</h1>
      <p className="section-sub">Quản lý các ngôn ngữ lập trình được hỗ trợ.</p>

      {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

      <form onSubmit={onCreate} className="form-card form-grid">
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
        <button type="submit" className="button" disabled={creating}>
          {creating ? "Đang tạo..." : "Thêm ngôn ngữ"}
        </button>
      </form>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 20 }}>
          <table>
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
                <tr key={l.IdNgonNgu}>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>#{l.IdNgonNgu}</td>
                  <td>{l.TenNgonNgu}</td>
                  <td>{l.TenNhanDien}</td>
                  <td>{l.TrangThai ? "Đang dùng" : "Tắt"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


