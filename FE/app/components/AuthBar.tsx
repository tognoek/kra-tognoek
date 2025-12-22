"use client";

import { useState } from "react";
import AuthModal from "./AuthModal";

export default function AuthBar() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button
        className="button"
        style={{ padding: "8px 14px", borderRadius: "10px" }}
        onClick={() => setOpen(true)}
      >
        Đăng nhập
      </button>
      <AuthModal open={open} mode="login" onClose={() => setOpen(false)} />
    </div>
  );
}



