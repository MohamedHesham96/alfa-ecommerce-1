"use client";

import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiAlertCircle } from "react-icons/fi";
import { useLanguage } from "../../../context/LanguageContext";

export function authFieldA11yProps(id, error, hint) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  };
}

export function AuthField({
  id,
  label,
  required = false,
  error = "",
  hint = "",
  children,
  className = "",
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className="text-[13px] font-semibold text-gray-700"
      >
        {label}
        {required ? (
          <span className="ms-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-[11px] font-medium leading-4 text-red-600"
        >
          <FiAlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] leading-4 text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthInput({
  id,
  label,
  type = "text",
  error = "",
  hint = "",
  required = false,
  icon = null,
  className = "",
  inputRef = null,
  ...inputProps
}) {
  const { t } = useLanguage();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword
    ? passwordVisible
      ? "text"
      : "password"
    : type;

  return (
    <AuthField
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <div
        className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg border bg-white ps-3 pe-2 shadow-sm transition ${
          error
            ? "border-red-500 ring-2 ring-red-100"
            : "border-gray-300 focus-within:border-[#d63b4d] focus-within:ring-2 focus-within:ring-[#fbe3e7]"
        }`}
      >
        <input
          id={id}
          ref={inputRef}
          type={resolvedType}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-500"
          {...inputProps}
          {...authFieldA11yProps(id, error, hint)}
          aria-label={inputProps["aria-label"] || label}
          aria-errormessage={error ? `${id}-error` : undefined}
          aria-required={required || undefined}
          required={required || undefined}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={
              passwordVisible
                ? t("hidePassword") || "Hide password"
                : t("showPassword") || "Show password"
            }
            aria-pressed={passwordVisible}
            className="-me-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {passwordVisible ? (
              <FaEye className="h-4 w-4" aria-hidden="true" />
            ) : (
              <FaEyeSlash className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : icon ? (
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-500"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
    </AuthField>
  );
}
