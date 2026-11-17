"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { useLanguage } from "../../../context/LanguageContext";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Accessible authentication dialog used by the header/cart popups and the
 * authenticated change-password form.
 *
 * Preserves the existing open/close contract while adding focus management,
 * Escape handling, background scroll locking and mobile-safe sizing.
 */
export default function AuthModal({
  open,
  onClose,
  labelledBy,
  children,
  maxWidth = "max-w-[520px]",
}) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;

    const focusFirstControl = () => {
      if (!dialog) return;

      const preferred = dialog.querySelector("[data-autofocus]");
      const focusable = dialog.querySelector(FOCUSABLE_SELECTOR);
      const target = preferred || focusable || dialog;
      target?.focus?.();
    };

    const frame =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(focusFirstControl)
        : (focusFirstControl(), null);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // Let an open combobox consume Escape first so it closes its own menu
        // instead of the whole dialog.
        const active = document.activeElement;
        if (
          active?.getAttribute?.("role") === "combobox" &&
          active.getAttribute("aria-expanded") === "true"
        ) {
          return;
        }

        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (frame && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frame);
      }
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      const restoreTarget = restoreFocusRef.current;
      if (restoreTarget && typeof restoreTarget.focus === "function") {
        restoreTarget.focus();
      }
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-4 sm:items-center sm:px-6 sm:py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative my-auto w-full ${maxWidth} overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl outline-none`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close") || "Close"}
          className="absolute end-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <MdClose className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-4rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
