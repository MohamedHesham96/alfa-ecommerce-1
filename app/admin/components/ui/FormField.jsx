export default function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = "",
  labelClassName = "",
}) {
  return (
    <div className={`admin-field ${className}`}>
      {label ? (
        <label htmlFor={htmlFor} className={`admin-label ${labelClassName}`}>
          <span>{label}</span>
          {required ? (
            <span className="admin-label-required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="admin-hint">{hint}</p>
      ) : null}
    </div>
  );
}
