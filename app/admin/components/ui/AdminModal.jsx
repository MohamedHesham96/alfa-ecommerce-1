"use client";

import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import { useLanguage } from "../../../../context/LanguageContext";

export default function AdminModal({
  open = true,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeLabel,
  bodyClassName = "",
  className = "",
}) {
  const { t } = useLanguage();
  const resolvedCloseLabel = closeLabel ?? t("close");
  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div
      className={`admin-modal-overlay ${open ? "flex" : "hidden"} ${className}`}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`admin-modal ${widths[size] ?? widths.md}`}
      >
        <div className="admin-modal-header">
          <div className="min-w-0">
            <h2 className="admin-modal-title">{title}</h2>
            {description ? (
              <p className="admin-modal-description">{description}</p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="admin-modal-close"
              aria-label={resolvedCloseLabel}
            >
              <MdClose className="text-xl" />
            </button>
          ) : null}
        </div>
        <div className={`admin-modal-body ${bodyClassName}`}>{children}</div>
        {footer ? <div className="admin-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
