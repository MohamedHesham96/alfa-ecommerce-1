"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "../../../context/LanguageContext";

/**
 * Route-level gate for System Settings. The side menu hides the entry for
 * client administrators, and this layout also blocks direct URL access.
 * The backend independently enforces the same rule on every API call, so
 * editing localStorage only reveals an empty shell that cannot load data.
 */
export default function SystemSettingsLayout({ children }) {
  const { locale } = useLanguage();
  const isArabic = locale === "ar";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const isAdmin = localStorage.getItem("role") === "ADMIN";
    const hasAccess =
      localStorage.getItem("systemSettingsAccess") === "true";
    setStatus(isAdmin && hasAccess ? "allowed" : "denied");
  }, []);

  if (status === "loading") {
    return (
      <div className="p-5" aria-busy="true">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-5 text-center">
        <Image
          src="/Images/logo.png"
          width={160}
          height={160}
          alt="logo"
          className="mb-8"
        />
        <h1 className="text-2xl font-semibold text-gray-800">
          {isArabic
            ? "غير مصرح لك بالوصول إلى إعدادات النظام"
            : "You are not authorized to view System Settings"}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
          {isArabic
            ? "هذه الشاشة مخصصة لحسابات BlueSoft المسؤولة عن دعم النظام فقط."
            : "This screen is reserved for BlueSoft-managed system support accounts."}
        </p>
        <Link
          href="/admin/Dashboard"
          className="mt-6 rounded-lg bg-[#204272] px-4 py-2 text-sm font-semibold text-white hover:bg-[#19345a]"
        >
          {isArabic ? "العودة إلى لوحة التحكم" : "Back to dashboard"}
        </Link>
      </div>
    );
  }

  return children;
}
