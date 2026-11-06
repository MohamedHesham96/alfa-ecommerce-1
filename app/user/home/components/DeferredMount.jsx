"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mounts expensive below-the-fold sections shortly before they can be seen.
 * The data fetch can stay eager (so scrolling feels instant), but React does
 * not need to build hundreds of product cards and carousel instances while
 * the browser is still hydrating the hero.
 */
export default function DeferredMount({
  children,
  minHeight = 600,
  rootMargin = "0px",
}) {
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setMounted(true);
        observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={containerRef} style={mounted ? undefined : { minHeight }}>
      {mounted ? children : null}
    </div>
  );
}
