"use client";

export function PreviewDialog({ changes, onClose, locale }) {
  const isArabic = locale === "ar";
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="configuration-preview-title"
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="configuration-preview-title" className="text-lg font-semibold text-gray-900">
            {isArabic ? "معاينة التغييرات" : "Preview changes"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            {isArabic ? "إغلاق" : "Close"}
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-5">
          {changes.length === 0 ? (
            <p className="text-sm text-gray-500">
              {isArabic ? "لا توجد تغييرات للمعاينة." : "There are no changes to preview."}
            </p>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <div key={change.key} className="rounded-xl border border-gray-200 p-3">
                  <p className="break-all font-mono text-xs font-semibold text-gray-800">
                    {change.key}
                  </p>
                  <div className="mt-2 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold">{isArabic ? "القيمة الحالية" : "Current"}:</span>{" "}
                      {change.valueMasked ? "••••••••" : formatPreviewValue(change.oldValue)}
                    </div>
                    <div>
                      <span className="font-semibold">{isArabic ? "القيمة الجديدة" : "New"}:</span>{" "}
                      {change.valueMasked ? "••••••••" : formatPreviewValue(change.newValue)}
                    </div>
                    <div>
                      <span className="font-semibold">{isArabic ? "المصدر" : "Source"}:</span>{" "}
                      {change.oldSource} → {change.newSource}
                    </div>
                    <div>
                      <span className="font-semibold">{isArabic ? "التفعيل" : "Activation"}:</span>{" "}
                      {change.activation}
                      {change.requiresRestart
                        ? isArabic
                          ? " (يتطلب إعادة تشغيل)"
                          : " (restart required)"
                        : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuditDialog({ records, loading, error, onClose, locale }) {
  const isArabic = locale === "ar";
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="configuration-audit-title"
        className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="configuration-audit-title" className="text-lg font-semibold text-gray-900">
            {isArabic ? "سجل تغييرات الإعدادات" : "Configuration audit history"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            {isArabic ? "إغلاق" : "Close"}
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-500">
              {isArabic ? "جارٍ تحميل السجل..." : "Loading history..."}
            </p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-500">
              {isArabic ? "لا توجد تغييرات مسجلة." : "No configuration changes have been recorded."}
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.auditId} className="rounded-xl border border-gray-200 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="break-all font-semibold text-gray-800">{record.key}</code>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600">
                      {record.action}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-gray-600 sm:grid-cols-2">
                    <div>
                      <span className="font-semibold">{isArabic ? "المستخدم" : "User"}:</span>{" "}
                      {record.changedBy || "system"}
                    </div>
                    <div>
                      <span className="font-semibold">{isArabic ? "التاريخ" : "Date"}:</span>{" "}
                      {record.changedDate || "—"}
                    </div>
                    <div>
                      <span className="font-semibold">{isArabic ? "القيمة السابقة" : "Previous"}:</span>{" "}
                      {record.redacted ? "••••••••" : formatPreviewValue(record.oldValue)}
                    </div>
                    <div>
                      <span className="font-semibold">{isArabic ? "القيمة الجديدة" : "New"}:</span>{" "}
                      {record.redacted ? "••••••••" : formatPreviewValue(record.newValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="configuration-confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 id="configuration-confirm-title" className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPreviewValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
