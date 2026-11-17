export default function StatCard({
  label,
  value,
  icon,
  tone = "rose",
  hint,
  onClick,
  className = "",
  valuePrefix = "",
}) {
  const content = (
    <>
      <div className="admin-stat-top">
        <div className="min-w-0">
          <p className="admin-stat-label">{label}</p>
          <p className="admin-stat-value mt-2">
            {valuePrefix}
            {value}
          </p>
          {hint ? <p className="admin-stat-hint">{hint}</p> : null}
        </div>
        {icon ? (
          <span className={`admin-stat-icon admin-tone-${tone}`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`admin-stat-card admin-stat-card--interactive ${className}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`admin-stat-card ${className}`}>{content}</div>;
}
