"use client";

import Link from "next/link";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * Friendly, non-destructive response for an ADMIN who opens a customer-only
 * storefront page. The admin session is never cleared or downgraded.
 */
export default function AdminRestrictedNotice({
  titleKey = "adminActionUnavailableTitle",
  descriptionKey = "adminActionUnavailableDescription",
}) {
  const { t } = useLanguage();

  return (
    <section
      data-testid="admin-restricted-notice"
      role="status"
      className="mx-auto my-10 w-full max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"
    >
      <h1 className="text-2xl font-bold text-amber-950">{t(titleKey)}</h1>
      <p className="mt-3 text-sm leading-7 text-amber-900">
        {t(descriptionKey)}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin/Dashboard"
          className="rounded-full bg-[#E14A5C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#CD4354]"
        >
          {t("goToAdminDashboard")}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        >
          {t("backToStorefront")}
        </Link>
      </div>
    </section>
  );
}
