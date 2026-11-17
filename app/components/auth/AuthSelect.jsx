"use client";

import Select from "react-select";
import { AuthField, authFieldA11yProps } from "./AuthField";

const selectStyles = (hasError) => ({
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: hasError
      ? "#ef4444"
      : state.isFocused
        ? "#6b7280"
        : "#d1d5db",
    boxShadow: hasError
      ? "0 0 0 2px #fee2e2"
      : state.isFocused
        ? "0 0 0 2px #e5e7eb"
        : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    backgroundColor: "#ffffff",
    fontSize: 14,
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    "&:hover": {
      borderColor: hasError ? "#ef4444" : "#9ca3af",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingInlineStart: 12,
    paddingInlineEnd: 6,
  }),
  singleValue: (base) => ({
    ...base,
    color: "#111827",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "#6b7280",
    paddingInlineEnd: 8,
    "&:hover": { color: "#374151" },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 6,
    overflow: "hidden",
    boxShadow:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    zIndex: 40,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 80 }),
  menuList: (base) => ({ ...base, paddingBlock: 4 }),
  option: (base, state) => ({
    ...base,
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    backgroundColor: state.isSelected
      ? "#dc2626"
      : state.isFocused
        ? "#fee2e2"
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#374151",
    "&:active": {
      backgroundColor: state.isSelected ? "#dc2626" : "#fecaca",
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    fontSize: 13,
    color: "#6b7280",
  }),
});

/**
 * Branded react-select field used by the authentication forms. The menu is
 * portaled so long option lists stay visible inside scrollable modals.
 */
export default function AuthSelect({
  id,
  label,
  required = false,
  error = "",
  hint = "",
  className = "",
  menuPortalTarget,
  selectRef = null,
  ...selectProps
}) {
  const portalTarget =
    menuPortalTarget ||
    (typeof document !== "undefined" ? document.body : undefined);

  return (
    <AuthField
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
    >
      <Select
        ref={selectRef}
        instanceId={id}
        inputId={id}
        classNamePrefix="auth-select"
        menuPortalTarget={portalTarget}
        styles={selectStyles(Boolean(error))}
        required={required}
        {...selectProps}
        {...authFieldA11yProps(id, error, hint)}
        aria-label={selectProps["aria-label"] || label}
        aria-errormessage={error ? `${id}-error` : undefined}
      />
    </AuthField>
  );
}
