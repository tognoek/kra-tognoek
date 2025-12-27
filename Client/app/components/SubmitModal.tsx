"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface SubmitModalProps {
  open: boolean;
  problemId: string;
  problemTitle?: string;
  contestId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Language {
  IdNgonNgu: string;
  TenNgonNgu: string;
  TenNhanDien: string;
  TrangThai: boolean;
}

export default function SubmitModal({
  open,
  problemId,
  problemTitle,
  contestId,
  onClose,
  onSuccess,
}: SubmitModalProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchLanguages();
      // Reset form
      setCode("");
      setFile(null);
      setMessage(null);
      setError(null);
    }
  }, [open]);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/languages`);
      if (res.ok) {
        const data = await res.json();
        const activeLangs = data.filter((l: Language) => l.TrangThai);
        setLanguages(activeLangs);
        if (activeLangs.length > 0 && !selectedLanguage) {
          setSelectedLanguage(activeLangs[0].IdNgonNgu);
        }
      }
    } catch (err) {
      console.error("Failed to fetch languages:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCode(event.target.result as string);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!selectedLanguage) {
      setError("Vui lòng chọn ngôn ngữ");
      return;
    }

    if (mode === "paste" && !code.trim()) {
      setError("Vui lòng nhập code hoặc chọn file");
      return;
    }

    if (mode === "upload" && !file) {
      setError("Vui lòng chọn file");
      return;
    }

    // Get current user
    const userStr = typeof window !== "undefined" ? window.localStorage.getItem("oj_user") : null;
    if (!userStr) {
      setError("Vui lòng đăng nhập để nộp bài");
      return;
    }

    let userData;
    try {
      userData = JSON.parse(userStr);
    } catch {
      setError("Lỗi đọc thông tin người dùng");
      return;
    }

    setLoading(true);

    try {
      // Determine language extension
      const lang = languages.find((l) => l.IdNgonNgu === selectedLanguage);
      const langExt = lang?.TenNhanDien === "c" ? "c" : "cpp";

      // Generate unique filename: [username][timestamp]
      const timestamp = Date.now();
      const username = userData.TenDangNhap || "user";
      const filename = `${username}_${timestamp}`;

      // Upload code to S3
      const uploadRes = await fetch(`${API_BASE}/api/upload/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          filename,
          language: langExt,
        }),
      });

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        throw new Error(uploadData?.error || "Upload file thất bại");
      }

      const uploadData = await uploadRes.json();

      // Create submission
      const submitRes = await fetch(`${API_BASE}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: userData.IdTaiKhoan,
          IdDeBai: problemId,
          IdNgonNgu: selectedLanguage,
          IdCuocThi: contestId || null,
          DuongDanCode: uploadData.url,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData?.error || "Nộp bài thất bại");
      }

      setMessage(`✅ Nộp bài thành công! Submission ID: ${submitData.IdBaiNop}`);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal modal-animate"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
            Nộp bài{problemTitle ? `: ${problemTitle}` : ""}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <div className="label">Ngôn ngữ <span style={{ color: "#c62828" }}>*</span></div>
            <select
              className="select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              required
            >
              <option value="">-- Chọn ngôn ngữ --</option>
              {languages.map((lang) => (
                <option key={lang.IdNgonNgu} value={lang.IdNgonNgu}>
                  {lang.TenNgonNgu}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={`button ${mode === "paste" ? "" : "button-secondary"}`}
                style={{ flex: 1 }}
              >
                Paste Code
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`button ${mode === "upload" ? "" : "button-secondary"}`}
                style={{ flex: 1 }}
              >
                Upload File
              </button>
            </div>

            {mode === "paste" ? (
              <textarea
                className="textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code của bạn vào đây..."
                rows={15}
                required
                style={{ fontFamily: "monospace", fontSize: "14px" }}
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept=".cpp,.c,.cc,.cxx"
                  onChange={handleFileChange}
                  style={{ marginBottom: "8px" }}
                />
                {file && (
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                    Đã chọn: {file.name}
                  </div>
                )}
                {code && (
                  <textarea
                    className="textarea"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Code sẽ được load từ file, bạn có thể chỉnh sửa..."
                    rows={15}
                    style={{ fontFamily: "monospace", fontSize: "14px" }}
                  />
                )}
              </div>
            )}
          </div>

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Đang nộp bài..." : "Nộp bài"}
          </button>

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: "4px",
                background: "#ffebee",
                color: "#c62828",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "4px",
                background: "#e8f5e9",
                color: "#2e7d32",
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}

          <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            💡 Tip: Bạn có thể xem kết quả chấm tại trang{" "}
            <Link href="/submissions" className="problem-link">
              Bài nộp
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

