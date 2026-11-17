"use client";

import { useEffect, useState } from "react";

import "./admin.css";
import Header from "./components/Header";
import SideMenu from "./components/SideMenu";
import AdminInactivityHandler from "./components/AdminInactivityHandler";
import AdminRouteGuard from "./components/AdminRouteGuard";
import { SystemSettingsAccessProvider } from "./context/SystemSettingsAccessContext";

export default function AdminLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <SystemSettingsAccessProvider>
        <AdminInactivityHandler>
          <main className="admin-shell flex min-w-0">
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
    </AdminRouteGuard>
  );
}
