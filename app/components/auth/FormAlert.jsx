"use client";

import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

/**
 * Form-level alert. Field-specific messages belong in AuthField instead, so
 * the same error is never presented twice.
 */
export default function FormAlert({
  tone = "error",
  children,
  className = "",
}) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm leading-5 ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-800"
      } ${className}`}
    >
      {isError ? (
        <FiAlertCircle
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
      ) : (
        <FiCheckCircle
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 whitespace-pre-line break-words">{children}</div>
    </div>
  );
}
