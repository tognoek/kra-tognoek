"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface SubmitFormProps {
  onSuccess?: () => void;
}

export default function SubmitForm({ onSuccess }: SubmitFormProps) {
  const [IdTaiKhoan, setUser] = useState("");
  const [IdDeBai, setProblem] = useState("");
  const [IdNgonNgu, setLang] = useState("");
  const [IdCuocThi, setContest] = useState("");
  const [DuongDanCode, setCodePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: IdTaiKhoan ? BigInt(IdTaiKhoan) : undefined,
          IdDeBai: IdDeBai ? BigInt(IdDeBai) : undefined,
          IdNgonNgu: IdNgonNgu ? BigInt(IdNgonNgu) : undefined,
          IdCuocThi: IdCuocThi ? BigInt(IdCuocThi) : undefined,
          DuongDanCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Nộp bài thất bại");
      setMessage(`Nộp thành công! Submission ID: ${data.IdBaiNop}`);
      setDuongDan();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const setDuongDan = () => {
    setCodePath("");
  };

  return (
    <form onSubmit={onSubmit} className="form-card form-grid">
      <div>
        <div className="label">IdTaiKhoan</div>
        <input className="input" value={IdTaiKhoan} onChange={(e) => setUser(e.target.value)} required />
      </div>
      <div>
        <div className="label">IdDeBai</div>
        <input className="input" value={IdDeBai} onChange={(e) => setProblem(e.target.value)} required />
      </div>
      <div>
        <div className="label">IdNgonNgu</div>
        <input className="input" value={IdNgonNgu} onChange={(e) => setLang(e.target.value)} required />
      </div>
      <div>
        <div className="label">IdCuocThi (tùy chọn)</div>
        <input className="input" value={IdCuocThi} onChange={(e) => setContest(e.target.value)} />
      </div>
      <div>
        <div className="label">Đường dẫn code</div>
        <input
          className="input"
          value={DuongDanCode}
          onChange={(e) => setCodePath(e.target.value)}
          placeholder="vd: s3://... hoặc http://..."
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="button"
      >
        {loading ? "Đang nộp..." : "Nộp bài"}
      </button>
      {message && (
        <div
          style={{
            padding: "12px",
            borderRadius: "4px",
            background: message.startsWith("Nộp thành công") ? "#e8f5e9" : "#ffebee",
            color: message.startsWith("Nộp thành công") ? "#2e7d32" : "#c62828",
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}

