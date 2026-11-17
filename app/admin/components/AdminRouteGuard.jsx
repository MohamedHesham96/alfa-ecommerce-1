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
  const { locale } = useLanguage();
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
        className="flex flex-col gap-10 justify-center items-center h-screen bg-color1"
        aria-busy="true"
        data-testid="admin-route-loading"
      >
        <Image
          src="/Images/logo.png"
          alt=""
          priority
          width={200}
          height={200}
          className="w-[100px] h-[100px] border-t-transparent rounded-full animate-pulse"
        />
        <h1 className="md:text-5xl xs:text-4xl font-serif font-semibold animate-pulse bg-gradient-to-r from-[#d62828] via-color3 to-color2 bg-clip-text text-transparent" />
      </div>
    );
  }

  if (role !== "ADMIN") {
    const isArabic = locale === "ar";

    return (
      <div
        className="w-full h-full flex justify-center items-center text-center"
        role="alert"
        data-testid="admin-route-forbidden"
      >
        <div>
          <div className="flex justify-center items-center mb-20">
            <Image
              src="/Images/logo.png"
              width={200}
              height={200}
              alt="logo"
              className="flex justify-center items-center"
            />
          </div>
          <h1 className="text-2xl font-semibold">
            {isArabic
              ? "غير مصرح لك بالوصول إلى هذه الصفحة"
              : "You are not authorized to view this page"}
          </h1>
        </div>
      </div>
    );
  }

  return children;
}
