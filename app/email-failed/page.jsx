"use client";

import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import AuthResultPage from "../components/auth/AuthResultPage";

export default function EmailFailedPage() {
  const { t } = useLanguage();

  return (
    <AuthResultPage
      tone="error"
      title={t("emailConfirmationFailed")}
      description={t("emailConfirmationFailedMessage")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/signin"
          className="inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
        >
          {t("backToSignIn")}
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-6 text-sm font-bold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
        >
          {t("home")}
        </Link>
      </div>
    </AuthResultPage>
  );
}
