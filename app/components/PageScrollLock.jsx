"use client";

import { useEffect, useRef } from "react";

const LOCK_CLASS = "page-scroll-locked";

// Every blocking layer used across the app. Hidden overlays are ignored by
// the visibility check, so class-only toggles (flex/hidden) are covered.
const OVERLAY_SELECTOR = [
  ".admin-modal-overlay",
  ".admin-drawer-overlay",
  ".swal2-container",
  '[aria-modal="true"]',
  "dialog[open]",
  ".fixed.inset-0",
].join(", ");

const isVisibleOverlay = (element) => {
  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0
  ) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const hasOpenOverlay = () => {
  for (const overlay of document.querySelectorAll(OVERLAY_SELECTOR)) {
    if (isVisibleOverlay(overlay)) return true;
  }
  return false;
};

/**
 * Locks page scrolling whenever a popup, drawer, loader or dialog is open,
 * whichever component rendered it. The document element is the real scroll
 * container in this app, so locking only `body` is not enough.
 */
export default function PageScrollLock() {
  const lockedRef = useRef(false);
  const previousOverflowRef = useRef("");
  const previousOverscrollRef = useRef("");
  const previousPaddingRef = useRef("");

  useEffect(() => {
    const root = document.documentElement;

    const setLocked = (shouldLock) => {
      if (shouldLock === lockedRef.current) return;
      lockedRef.current = shouldLock;

      if (shouldLock) {
        const scrollbarWidth = window.innerWidth - root.clientWidth;
        previousOverflowRef.current = root.style.overflow;
        previousOverscrollRef.current = root.style.overscrollBehavior;
        previousPaddingRef.current = root.style.paddingInlineEnd;

        if (scrollbarWidth > 0) {
          root.style.paddingInlineEnd = `${scrollbarWidth}px`;
        }
        root.style.overflow = "hidden";
        root.style.overscrollBehavior = "none";
        root.classList.add(LOCK_CLASS);
      } else {
        root.classList.remove(LOCK_CLASS);
        root.style.overflow = previousOverflowRef.current;
        root.style.overscrollBehavior = previousOverscrollRef.current;
        root.style.paddingInlineEnd = previousPaddingRef.current;
      }
    };

    const sync = () => setLocked(hasOpenOverlay());

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden", "open"],
    });

    sync();

    return () => {
      observer.disconnect();
      setLocked(false);
    };
  }, []);

  return null;
}
