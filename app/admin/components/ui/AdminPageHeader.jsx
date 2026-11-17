export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
  className = "",
}) {
  return (
    <header className={`admin-page-header ${className}`}>
      <div className="admin-page-heading">
        {eyebrow ? (
          <span className="admin-page-eyebrow">
            {icon ? <span aria-hidden="true">{icon}</span> : null}
            {eyebrow}
          </span>
        ) : null}
        <h1 className="admin-page-title">{title}</h1>
        {description ? (
          <p className="admin-page-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </header>
  );
}
