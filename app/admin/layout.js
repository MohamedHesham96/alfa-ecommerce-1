import "./admin.css";
import { Alexandria } from "next/font/google";

import AdminThemeScript from "./components/AdminThemeScript";
import AdminShell from "./components/AdminShell";

// The admin dashboard has its own typeface so its screens stay visually
// consistent regardless of the storefront's language/font setup.
const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

/**
 * Admin-only route shell. The theme bootstrap script is rendered by this
 * server component so it is part of the initial HTML and runs before the
 * admin UI paints. The interactive shell stays in a client component.
 */
export default function AdminLayout({ children }) {
  return (
    <>
      <AdminThemeScript />
      <AdminShell fontClassName={alexandria.variable}>{children}</AdminShell>
    </>
  );
}
