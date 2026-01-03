"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Import Editor và PrismJS
import Editor from "react-simple-code-editor";
import { highlight, languages as prismLangs } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/themes/prism.css"; // Theme sáng cho editor

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

interface Language {
  IdNgonNgu: string;
  TenNgonNgu: string;
  TenNhanDien: string;
  TrangThai: boolean;
}

interface SubmitModalProps {
  open: boolean;
  problemId: string;
  problemTitle?: string;
  contestId?: string;
  onClose: () => void;
  onSuccess?: () => void;
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
      setCode("");
      setFile(null);
      setMessage(null);
      setError(null);
    }
  }, [open]);

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/languages/active`);
      if (res.ok) {
        const data = await res.json();
        setLanguages(data);
        if (data.length > 0) setSelectedLanguage(data[0].IdNgonNgu);
      }
    } catch (err) {
      console.error("Failed to fetch languages:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setCode(event.target.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!selectedLanguage) return setError("Vui lòng chọn ngôn ngữ");
    if (!code.trim()) return setError("Vui lòng nhập code hoặc chọn file");

    const userStr = localStorage.getItem("oj_user");
    if (!userStr) return setError("Vui lòng đăng nhập để nộp bài");

    const userData = JSON.parse(userStr);
    setLoading(true);

    try {
      const lang = languages.find((l) => l.IdNgonNgu === selectedLanguage);
      const langExt = lang?.TenNhanDien === "c" ? "c" : "cpp";
      const filename = `${userData.TenDangNhap || "user"}_${Date.now()}`;

      // 1. Upload code
      const uploadRes = await fetch(`${API_BASE}/api/upload/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, filename, language: langExt }),
      });

      if (!uploadRes.ok) throw new Error("Upload file thất bại");
      const { url } = await uploadRes.json();

      // 2. Submit bài
      const submitRes = await fetch(`${API_BASE}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdTaiKhoan: userData.IdTaiKhoan,
          IdDeBai: problemId,
          IdNgonNgu: selectedLanguage,
          IdCuocThi: contestId || null,
          DuongDanCode: url,
          Code: code,
        }),
      });

      if (!submitRes.ok) throw new Error("Nộp bài thất bại");

      setMessage("✅ Nộp bài thành công!");
      if (onSuccess) setTimeout(() => { onSuccess(); onClose(); }, 1500);
      else setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHighlightLanguage = () => {
    const lang = languages.find((l) => l.IdNgonNgu === selectedLanguage);
    if (lang?.TenNhanDien.includes("cpp")) return prismLangs.cpp;
    if (lang?.TenNhanDien === "c") return prismLangs.c;
    return prismLangs.clike;
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={styles.backdrop}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Nộp bài{problemTitle ? `: ${problemTitle}` : ""}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={styles.label}>Ngôn ngữ *</label>
            <select style={styles.select} value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
              {languages.map((lang) => (
                <option key={lang.IdNgonNgu} value={lang.IdNgonNgu}>{lang.TenNgonNgu}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <button type="button" onClick={() => setMode("paste")} style={mode === "paste" ? styles.tabActive : styles.tab}>Nhập code</button>
              <button type="button" onClick={() => setMode("upload")} style={mode === "upload" ? styles.tabActive : styles.tab}>Tải file</button>
            </div>

            {mode === "upload" && (
              <input type="file" accept=".cpp,.c" onChange={handleFileChange} style={{ marginBottom: "10px", display: "block" }} />
            )}

            <div style={styles.editorContainer}>
              <Editor
                value={code}
                onValueChange={(c) => setCode(c)}
                highlight={(c) => highlight(c, getHighlightLanguage(), "cpp")}
                padding={15}
                style={styles.editor}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btnSubmit}>
            {loading ? "Đang xử lý..." : "Nộp bài ngay"}
          </button>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "white", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "850px", maxHeight: "90vh", overflowY: "auto" as const },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  closeBtn: { border: "none", background: "none", fontSize: "20px", cursor: "pointer" },
  label: { display: "block", marginBottom: "5px", fontWeight: 600, fontSize: "14px" },
  select: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" },
  tab: { flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer" },
  tabActive: { flex: 1, padding: "8px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "white", cursor: "pointer" },
  editorContainer: { border: "1px solid #ddd", borderRadius: "8px", background: "#f8f9fa", minHeight: "300px", maxHeight: "450px", overflow: "auto" },
  editor: { fontFamily: '"Fira code", monospace', fontSize: 14, minHeight: "300px" },
  btnSubmit: { width: "100%", padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", marginTop: "15px" },
  btnDisabled: { width: "100%", padding: "12px", background: "#94a3b8", color: "white", border: "none", borderRadius: "8px", marginTop: "15px" },
  error: { marginTop: "10px", padding: "10px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "14px" },
  success: { marginTop: "10px", padding: "10px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", fontSize: "14px" },
};