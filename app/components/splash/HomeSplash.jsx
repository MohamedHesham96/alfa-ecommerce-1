"use client";

import { useCallback, useState } from "react";

import SplashScreen from "./SplashScreen";

/**
 * Mounts the homepage intro overlay. The splash markup is rendered on the
 * server (hidden by CSS for visitors who already saw it) so there is no flash
 * of the page underneath before hydration. SplashScreen decides from the boot
 * attribute whether this visitor should actually see it.
 */
export default function HomeSplash() {
  const [visible, setVisible] = useState(true);

  const handleDone = useCallback((reason) => {
    setVisible(false);

    // "hidden" means this visitor already saw the splash; don't steal focus.
    if (reason === "hidden") return;

    // The overlay covered the page; move keyboard focus to the page itself
    // without scrolling so the first Tab reaches the content naturally.
    window.requestAnimationFrame(() => {
      const target = document.querySelector("main");
      if (!(target instanceof HTMLElement)) return;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
        once: true,
      });
    });
  }, []);

  if (!visible) return null;

  return <SplashScreen onDone={handleDone} />;
}
