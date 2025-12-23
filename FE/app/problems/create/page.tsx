"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface UserInfo {
  IdTaiKhoan: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  VaiTro: string;
}

export default function CreateProblemPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [TieuDe, setTieuDe] = useState("");
  const [NoiDungDeBai, setNoiDungDeBai] = useState("");
  const [DoKho, setDoKho] = useState("Easy");
  const [GioiHanThoiGian, setTimeLimit] = useState(1000);
  const [GioiHanBoNho, setMemoryLimit] = useState(256);
  const [DangCongKhai, setPublic] = useState(true);
  const [testFile, setTestFile] = useState<File | null>(null);
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",")[1] || "";
          resolve(base64);
        } else {
          reject(new Error("Không đọc được file"));
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Không đọc được file"));
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isCreator) return;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: Number(user.IdTaiKhoan),
          TieuDe,
          NoiDungDeBai,
          DoKho,
          GioiHanThoiGian,
          GioiHanBoNho,
          DangCongKhai,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Tạo đề thất bại");
      }

      // Nếu có bộ test, upload tiếp lên server để gắn với đề
      if (testFile && data?.IdDeBai) {
        try {
          const base64 = await fileToBase64(testFile);
          await fetch(`${API_BASE}/api/upload/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileBase64: base64,
              originalName: testFile.name,
              problemId: data.IdDeBai,
            }),
          });
        } catch (err) {
          console.error("Upload test error:", err);
          // không chặn flow, chỉ log
        }
      }

      router.push("/problems");
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
        <h2>Bạn không có quyền tạo đề</h2>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h1 className="section-title">Tạo đề mới</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={onSubmit} className="form-grid">
        <div className="form-group">
          <div className="label">Tiêu đề</div>
          <input className="input" value={TieuDe} onChange={(e) => setTieuDe(e.target.value)} required />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <div className="label">Nội dung</div>
          <textarea
            className="textarea"
            value={NoiDungDeBai}
            onChange={(e) => setNoiDungDeBai(e.target.value)}
            rows={8}
            required
          />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <div className="label">Xem trước (Markdown)</div>
          <div
            className="form-card"
            style={{
              background: "#f8f9fa",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "16px",
              minHeight: "120px",
            }}
          >
            {NoiDungDeBai.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {NoiDungDeBai}
              </ReactMarkdown>
            ) : (
              <span style={{ color: "#888" }}>Nội dung xem trước sẽ hiển thị tại đây</span>
            )}
          </div>
        </div>
        <div className="form-group">
          <div className="label">Độ khó</div>
          <select className="select" value={DoKho} onChange={(e) => setDoKho(e.target.value)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div className="form-group">
          <div className="label">Giới hạn thời gian (ms)</div>
          <input
            type="number"
            className="input"
            value={GioiHanThoiGian}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            min={1}
            required
          />
        </div>
        <div className="form-group">
          <div className="label">Giới hạn bộ nhớ (MB)</div>
          <input
            type="number"
            className="input"
            value={GioiHanBoNho}
            onChange={(e) => setMemoryLimit(Number(e.target.value))}
            min={1}
            required
          />
        </div>
        <div className="form-group">
          <div className="label">Công khai</div>
          <select
            className="select"
            value={DangCongKhai ? "true" : "false"}
            onChange={(e) => setPublic(e.target.value === "true")}
          >
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <div className="label">Upload bộ test (.zip)</div>
          <input
            type="file"
            accept=".zip"
            className="input"
            onChange={(e) => setTestFile(e.target.files?.[0] || null)}
          />
          <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
            File .zip sẽ được gửi lên server, lưu trên S3 và gắn với đề bài này.
          </div>
        </div>
        <button type="submit" className="button" disabled={saving}>
          {saving ? "Đang tạo..." : "Tạo đề"}
        </button>
      </form>
    </div>
  );
}