"use client";

export default function AuthSubmitButton({
  loading = false,
  label,
  loadingLabel,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-l from-[#b8243b] via-[#d63b4d] to-[#e14a5c] px-4 text-sm font-bold text-white shadow-[0_12px_26px_-14px_rgba(184,36,59,0.9)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d63b4d] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      ) : null}
      <span>{loading ? loadingLabel : label}</span>
    </button>
  );
}
