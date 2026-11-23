export const salesReportSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--admin-surface)",
    border: `1px solid ${
      state.isFocused ? "var(--admin-accent)" : "var(--admin-border-strong)"
    }`,
    borderRadius: "10px",
    minHeight: "40px",
    cursor: "pointer",
    boxShadow: state.isFocused ? "0 0 0 3px var(--admin-focus-ring)" : "none",
    "&:hover": {
      borderColor: "var(--admin-info-border)",
      backgroundColor: "var(--admin-info-soft)",
    },
  }),
  valueContainer: (base) => ({ ...base, paddingInline: "0.65rem" }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "var(--admin-info-soft)",
    borderRadius: "7px",
    border: "1px solid var(--admin-info-border)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "var(--admin-info-text)",
    fontSize: "12px",
    fontWeight: 700,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--admin-info-text)",
    ":hover": { backgroundColor: "var(--admin-info-soft-hover)", color: "var(--admin-ink)" },
  }),
  option: (base, state) => ({
    ...base,
    margin: "2px 0",
    padding: "8px 10px",
    borderRadius: "7px",
    backgroundColor: state.isSelected
      ? "var(--admin-accent-solid)"
      : state.isFocused
        ? "var(--admin-info)"
        : "transparent",
    color: state.isSelected
      ? "var(--admin-on-accent)"
      : state.isFocused
        ? "var(--admin-surface)"
        : "var(--admin-ink-soft)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  }),
  menu: (base) => ({
    ...base,
    marginTop: 2,
    padding: 4,
    backgroundColor: "var(--admin-surface)",
    border: "1px solid var(--admin-border)",
    borderRadius: "10px",
    boxShadow: "var(--admin-shadow-popover)",
    zIndex: 9999,
    overflow: "hidden",
  }),
  menuList: (base) => ({ ...base, padding: 0 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  placeholder: (base) => ({
    ...base,
    color: "var(--admin-muted)",
    fontSize: "13px",
    fontWeight: 600,
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--admin-ink-soft)",
    fontSize: "13px",
    fontWeight: 600,
  }),
  input: (base) => ({ ...base, color: "var(--admin-ink-soft)" }),
  clearIndicator: (base) => ({ ...base, color: "var(--admin-muted-soft)" }),
  dropdownIndicator: (base) => ({ ...base, color: "var(--admin-muted-soft)" }),
  indicatorSeparator: () => ({ display: "none" }),
  noOptionsMessage: (base) => ({
    ...base,
    color: "var(--admin-muted)",
    fontSize: "12px",
  }),
};
