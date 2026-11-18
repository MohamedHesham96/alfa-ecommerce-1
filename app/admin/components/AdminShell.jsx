"use client";

import { useEffect, useRef, useState } from "react";

import Header from "./Header";
import SideMenu from "./SideMenu";
import AdminInactivityHandler from "./AdminInactivityHandler";
import AdminRouteGuard from "./AdminRouteGuard";
import { AdminThemeProvider } from "../context/AdminThemeContext";
import { SystemSettingsAccessProvider } from "../context/SystemSettingsAccessContext";

export default function AdminShell({ children, fontClassName = "" }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pageThumbTimerRef = useRef(null);
  const [pageThumb, setPageThumb] = useState({
    visible: false,
    top: 0,
    left: 0,
    height: 0,
  });

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

    const updatePageThumb = () => {
      const root = document.documentElement;
      const viewport = window.innerHeight;
      const scrollHeight = Math.max(
        root.scrollHeight,
        document.body.scrollHeight,
      );
      const maxScroll = scrollHeight - viewport;
      if (maxScroll <= 1) {
        setPageThumb((previous) =>
          previous.visible ? { ...previous, visible: false } : previous,
        );
        return;
      }

      const height = Math.max(36, (viewport / scrollHeight) * viewport);
      const top = (window.scrollY / maxScroll) * (viewport - height);
      const isRtl = getComputedStyle(root).direction === "rtl";
      setPageThumb({
        visible: true,
        top,
        left: isRtl ? 2 : window.innerWidth - 7,
        height,
      });

      window.clearTimeout(pageThumbTimerRef.current);
      pageThumbTimerRef.current = window.setTimeout(() => {
        setPageThumb((previous) => ({ ...previous, visible: false }));
      }, 900);
    };

    const onScroll = (event) => {
      const target = event.target;
      if (target === document || target === window) {
        updatePageThumb();
      }
      const element =
        target === document || target === window
          ? document.documentElement
          : target instanceof Element
            ? target.closest(scrollTargets)
            : null;
      if (element) reveal(element);
    };

    const onResize = () => updatePageThumb();

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
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerover", onPointerOver, true);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(pageThumbTimerRef.current);
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
            <span
              className="admin-page-scrollthumb"
              aria-hidden="true"
              style={{
                top: `${pageThumb.top}px`,
                left: `${pageThumb.left}px`,
                height: `${pageThumb.height}px`,
                opacity: pageThumb.visible ? 1 : 0,
              }}
            />
          </AdminInactivityHandler>
        </SystemSettingsAccessProvider>
      </AdminThemeProvider>
    </AdminRouteGuard>
  );
}
