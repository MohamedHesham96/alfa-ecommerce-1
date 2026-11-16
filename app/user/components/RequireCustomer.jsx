"use client";

import AdminRestrictedNotice from "./AdminRestrictedNotice";
import { useAuthRole } from "../../../utils/authRole";

/**
 * Blocks only ADMIN sessions. Guests and customers keep the existing
 * behavior, including guest carts and guest wishlists.
 */
export default function RequireCustomer({ children }) {
  const { isAdmin, ready } = useAuthRole();

  if (!ready) {
    return <div className="min-h-[40vh] w-full" aria-busy="true" />;
  }

  if (isAdmin) {
    return <AdminRestrictedNotice />;
  }

  return children;
}
