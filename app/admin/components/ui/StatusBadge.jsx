const TONES = {
  success: "admin-badge-green",
  delivered: "admin-badge-green",
  approved: "admin-badge-green",
  active: "admin-badge-green",
  warning: "admin-badge-amber",
  pending: "admin-badge-amber",
  shipped: "admin-badge-amber",
  info: "admin-badge-blue",
  processing: "admin-badge-blue",
  danger: "admin-badge-red",
  cancelled: "admin-badge-red",
  canceled: "admin-badge-red",
  rejected: "admin-badge-red",
  refunded: "admin-badge-purple",
  purple: "admin-badge-purple",
  neutral: "admin-badge-gray",
  gray: "admin-badge-gray",
};

export function statusTone(value) {
  if (!value) return "neutral";
  return TONES[String(value).toLowerCase()] ? String(value).toLowerCase() : "neutral";
}

export default function StatusBadge({ tone = "neutral", children, dot = true, className = "" }) {
  const toneClass = TONES[tone] ?? TONES.neutral;
  return (
    <span className={`admin-badge ${toneClass} ${className}`}>
      {dot ? <span className="admin-badge-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
