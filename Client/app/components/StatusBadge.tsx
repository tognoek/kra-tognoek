interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStatusClass = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === "accepted" || lower === "ac" || lower === "public" || lower === "active" || lower === "công khai" || lower === "hoạt động") {
      return "pill pill-green";
    }
    if (lower === "pending" || lower === "queued" || lower === "running" || lower === "đang chấm") {
      return "pill pill-yellow";
    }
    if (lower === "wrong answer" || lower === "wa" || lower === "rejected" || lower === "private" || lower === "closed" || lower === "riêng tư" || lower === "không hoạt động") {
      return "pill pill-red";
    }
    if (lower === "time limit exceeded" || lower === "tle") {
      return "pill pill-orange";
    }
    if (lower === "memory limit exceeded" || lower === "mle") {
      return "pill pill-blue";
    }
    return "pill pill-gray";
  };

  return <span className={`${getStatusClass(status)} ${className}`}>{status}</span>;
}

