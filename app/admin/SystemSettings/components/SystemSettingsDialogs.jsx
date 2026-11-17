"use client";

export function PreviewDialog({ changes, onClose, locale }) {
  const isArabic = locale === "ar";
  return (
    <div className="admin-modal-overlay z-[70]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="configuration-preview-title"
        className="admin-modal max-w-3xl"
      >
        <div className="admin-modal-header">
          <h2 id="configuration-preview-title" className="admin-modal-title">
            {isArabic ? "معاينة التغييرات" : "Preview changes"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary admin-btn-xs"
          >
            {isArabic ? "إغلاق" : "Close"}
          </button>
        </div>
        <div className="admin-modal-body max-h-[65vh]">
          {changes.length === 0 ? (
            <p className="text-sm text-gray-500">
              {isArabic ? "لا توجد تغييرات للمعاينة." : "There are no changes to preview."}
            </p>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <div key={change.key} className="rounded-xl border border-[#e4e8f0] bg-[#fbfcfe] p-3">
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
    <div className="admin-modal-overlay z-[70]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="configuration-audit-title"
        className="admin-modal max-w-4xl"
      >
        <div className="admin-modal-header">
          <h2 id="configuration-audit-title" className="admin-modal-title">
            {isArabic ? "سجل تغييرات الإعدادات" : "Configuration audit history"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary admin-btn-xs"
          >
            {isArabic ? "إغلاق" : "Close"}
          </button>
        </div>
        <div className="admin-modal-body max-h-[70vh]">
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
                <div key={record.auditId} className="rounded-xl border border-[#e4e8f0] bg-[#fbfcfe] p-3 text-xs">
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
    <div className="admin-modal-overlay z-[70]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="configuration-confirm-title"
        className="admin-modal max-w-md"
      >
        <div className="admin-modal-body">
          <h2 id="configuration-confirm-title" className="admin-modal-title">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{message}</p>
        </div>
        <div className="admin-modal-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="admin-btn admin-btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="admin-btn admin-btn-danger-solid"
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
