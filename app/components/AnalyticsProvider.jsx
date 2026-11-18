"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  setAnalyticsEnabled,
  startAnalytics,
  trackPageView,
} from "../../lib/analytics/client";

/**
 * Mounts the anonymous-friendly storefront tracker once for the whole app.
 * Admin dashboard routes are explicitly disabled so admin activity never
 * enters storefront analytics.
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const stop = startAnalytics();
    return () => stop?.();
  }, []);

  useEffect(() => {
    const isAdminArea =
      typeof pathname === "string" && pathname.startsWith("/admin");
    setAnalyticsEnabled(!isAdminArea);
    if (!isAdminArea) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
