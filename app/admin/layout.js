import "./admin.css";
import AdminThemeScript from "./components/AdminThemeScript";
import AdminShell from "./components/AdminShell";

/**
 * Admin-only route shell. The theme bootstrap script is rendered by this
 * server component so it is part of the initial HTML and runs before the
 * admin UI paints. The interactive shell stays in a client component.
 */
export default function AdminLayout({ children }) {
  return (
    <>
      <AdminThemeScript />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
