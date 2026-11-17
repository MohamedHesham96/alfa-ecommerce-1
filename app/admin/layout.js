"use client";
import Header from "./components/Header";
import SideMenu from "./components/SideMenu";
import AdminInactivityHandler from "./components/AdminInactivityHandler";
import AdminRouteGuard from "./components/AdminRouteGuard";
import { SystemSettingsAccessProvider } from "./context/SystemSettingsAccessContext";

export default function AdminLayout({ children }) {
  return (
    <AdminRouteGuard>
      <SystemSettingsAccessProvider>
        <AdminInactivityHandler>
          <main className=" flex min-w-0  ">
            <SideMenu homepage={"bg-red-100 text-red-500"} />
            <div className="w-full h-full min-w-0 ">
              <Header page_title={"Homepage Management"} />
              <div className="  ">{children}</div>
            </div>
          </main>
        </AdminInactivityHandler>
      </SystemSettingsAccessProvider>
    </AdminRouteGuard>
  );
}
