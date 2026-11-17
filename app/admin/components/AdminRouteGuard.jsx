"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useLanguage } from "../../../context/LanguageContext";
import {
  buildSignInUrl,
  getCurrentRelativeUrl,
} from "../../../utils/authRedirect";
import { useAuthRole } from "../../../utils/authRole";
import { clearAuthStorage } from "../../../utils/authSession";

/**
 * Route-level gate for the admin application.
 *
 * - Guests are sent to /signin with the current admin URL preserved, so an
 *   order link from an email can be resumed after authentication.
 * - A valid non-admin session gets the existing forbidden page and is never
 *   silently redirected into the customer area.
 * - The backend still authorizes every request; this guard only controls UI.
 */
export default function AdminRouteGuard({ children }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { role, ready, hasSession } = useAuthRole();

  useEffect(() => {
    if (!ready || hasSession) return;

    const returnUrl = getCurrentRelativeUrl();
    clearAuthStorage().finally(() => {
      router.replace(buildSignInUrl(returnUrl));
    });
  }, [ready, hasSession, router]);

  if (!ready || !hasSession) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--admin-canvas)]"
        aria-busy="true"
        data-testid="admin-route-loading"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
          <Image
            src="/Images/logo.png"
            alt=""
            priority
            width={200}
            height={200}
            className="h-12 w-12 animate-pulse object-contain"
          />
        </span>
        <div className="flex flex-col items-center gap-2">
          <span className="admin-spinner !h-6 !w-6" />
          <p className="text-sm font-semibold text-[var(--admin-muted)]">
            {t("checking_session")}
          </p>
        </div>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div
        className="flex h-screen w-full items-center justify-center bg-[var(--admin-canvas)] p-5 text-center"
        role="alert"
        data-testid="admin-route-forbidden"
      >
        <div className="admin-card w-full max-w-lg p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
            <Image
              src="/Images/logo.png"
              width={200}
              height={200}
              alt={t("logo_alt")}
              className="h-10 w-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-ink)]">
            {t("unauthorized_page")}
          </h1>
        </div>
      </div>
    );
  }

  return children;
}
