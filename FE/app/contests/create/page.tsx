"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function CreateContestPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [TenCuocThi, setTenCuocThi] = useState("");
  const [MoTa, setMoTa] = useState("");
  const [ThoiGianBatDau, setStart] = useState("");
  const [ThoiGianKetThuc, setEnd] = useState("");
  const [problemsInput, setProblemsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isCreator) return;

    try {
      setSaving(true);
      setError(null);
      const problems =
        problemsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((id) => ({ IdDeBai: id, TenHienThi: "" })) || [];

      const res = await fetch(`${API_BASE}/api/contests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: Number(user.IdTaiKhoan),
          TenCuocThi,
          MoTa,
          ThoiGianBatDau,
          ThoiGianKetThuc,
          problems,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Tạo cuộc thi thất bại");
      }
      router.push("/contests");
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang kiểm tra quyền...</div>;
  }

  if (!user) {
    return (
      <div className="form-card">
        <h2>Vui lòng đăng nhập</h2>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="form-card">
        <h2>Bạn không có quyền tạo cuộc thi</h2>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h1 className="section-title">Tạo cuộc thi mới</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit} className="form-grid">
        <div className="form-group">
          <div className="label">Tên cuộc thi</div>
          <input className="input" value={TenCuocThi} onChange={(e) => setTenCuocThi(e.target.value)} required />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <div className="label">Mô tả</div>
          <textarea
            className="textarea"
            value={MoTa}
            onChange={(e) => setMoTa(e.target.value)}
            rows={6}
            required
          />
        </div>
        <div className="form-group">
          <div className="label">Thời gian bắt đầu</div>
          <input
            type="datetime-local"
            className="input"
            value={ThoiGianBatDau}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <div className="label">Thời gian kết thúc</div>
          <input
            type="datetime-local"
            className="input"
            value={ThoiGianKetThuc}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <div className="label">Danh sách ID đề (phân cách bằng dấu phẩy)</div>
          <input
            className="input"
            value={problemsInput}
            onChange={(e) => setProblemsInput(e.target.value)}
            placeholder="Ví dụ: 1, 2, 3"
          />
        </div>
        <button type="submit" className="button" disabled={saving}>
          {saving ? "Đang tạo..." : "Tạo cuộc thi"}
        </button>
      </form>
    </div>
  );
}