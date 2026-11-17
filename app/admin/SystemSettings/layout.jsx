"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "../../../context/LanguageContext";
import { useSystemSettingsAccess } from "../context/SystemSettingsAccessContext";

/**
 * Route-level gate for System Settings. The side menu hides the entry unless
 * the backend grants access, and this layout also blocks direct URL access.
 * The backend independently enforces the same rule on every API call, so
 * tampering with localStorage only reveals an empty shell that cannot load
 * data.
 */
export default function SystemSettingsLayout({ children }) {
  const { locale } = useLanguage();
  const isArabic = locale === "ar";
  const { status, canAccess } = useSystemSettingsAccess();

  if (status === "loading") {
    return (
      <div className="admin-page" aria-busy="true">
        <div className="admin-skeleton h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="admin-skeleton h-72 rounded-2xl" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="admin-skeleton h-40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-5 text-center">
        <div className="admin-card w-full max-w-lg p-8">
          <Image
            src="/Images/logo.png"
            width={160}
            height={160}
            alt="Alfa"
            className="mx-auto mb-5 h-16 w-16 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-ink)]">
            {isArabic
              ? "غير مصرح لك بالوصول إلى إعدادات النظام"
              : "You are not authorized to view System Settings"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--admin-muted)]">
            {isArabic
              ? "لم يمنح مسؤول النظام هذا الحساب صلاحية الوصول إلى إعدادات النظام."
              : "This account has not been granted access to System Settings."}
          </p>
          <Link href="/admin/Dashboard" className="admin-btn admin-btn-primary mt-6">
            {isArabic ? "العودة إلى لوحة التحكم" : "Back to dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
