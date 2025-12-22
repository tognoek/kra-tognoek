"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("oj_admin_token") || "";
      setToken(saved);
    }
  }, []);

  const onSaveToken = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("oj_admin_token", token.trim());
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/admin" className="nav-link" style={{ paddingLeft: 0 }}>
            Admin Dashboard
          </Link>
          <Link href="/admin/users" className="nav-link">
            Users
          </Link>
          <Link href="/admin/languages" className="nav-link">
            Languages
          </Link>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 480, width: "100%" }}>
          <input
            type="text"
            className="input"
            placeholder="JWT token (Authorization: Bearer ...)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="button" className="button" onClick={onSaveToken}>
            Lưu
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}


