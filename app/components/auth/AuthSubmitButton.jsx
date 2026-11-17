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
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
