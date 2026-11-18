"use client";

import { useEffect, useState } from "react";

import Header from "./Header";
import SideMenu from "./SideMenu";
import AdminInactivityHandler from "./AdminInactivityHandler";
import AdminRouteGuard from "./AdminRouteGuard";
import { AdminThemeProvider } from "../context/AdminThemeContext";
import { SystemSettingsAccessProvider } from "../context/SystemSettingsAccessContext";

export default function AdminShell({ children, fontClassName = "" }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // The scrollbar thumb is hidden until the user scrolls (or hovers the
  // scroll container). This keeps tables and the sidebar visually clean without
  // a permanent grey rail, and it also covers the page scrollbar.
  useEffect(() => {
    const scrollTargets =
      ".admin-sidebar, .admin-table-shell, .admin-drawer-body, .admin-modal-body";
    const timers = new Map();

    const hideOthers = (keep) => {
      timers.forEach((timer, element) => {
        if (element === keep) return;
        window.clearTimeout(timer);
        element.classList.remove("admin-scroll-active");
        timers.delete(element);
      });
    };

    const reveal = (element) => {
      hideOthers(element);
      element.classList.add("admin-scroll-active");
      const previous = timers.get(element);
      if (previous) window.clearTimeout(previous);
      const timer = window.setTimeout(() => {
        element.classList.remove("admin-scroll-active");
        timers.delete(element);
      }, 900);
      timers.set(element, timer);
    };

    const onScroll = (event) => {
      const target = event.target;
      const element =
        target === document || target === window
          ? document.documentElement
          : target instanceof Element
            ? target.closest(scrollTargets)
            : null;
      if (element) reveal(element);
    };

    // Moving the pointer between regions should retire the previous region's
    // bar immediately, so the sidebar and a table never show two bars at once.
    const onPointerOver = (event) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest(scrollTargets);
      // Outside every scroll region, retire all bars so nothing lingers next
      // to the page scrollbar.
      hideOthers(element ?? null);
    };

    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("pointerover", onPointerOver, true);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerover", onPointerOver, true);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileSidebarOpen]);

  return (
    <AdminRouteGuard>
      <AdminThemeProvider>
        <SystemSettingsAccessProvider>
          <AdminInactivityHandler>
            <main className={`admin-shell flex min-w-0 ${fontClassName}`}>
              <SideMenu
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
              />
              <div className="admin-main min-w-0">
                <Header onMenuClick={() => setMobileSidebarOpen(true)} />
                <div className="admin-content">{children}</div>
              </div>
            </main>
          </AdminInactivityHandler>
        </SystemSettingsAccessProvider>
      </AdminThemeProvider>
    </AdminRouteGuard>
  );
}
