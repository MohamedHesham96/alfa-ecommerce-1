"use client";

import Image from "next/image";
import Link from "next/link";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { MdLanguage } from "react-icons/md";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * Shared branded result screen used by email confirmation success/failure.
 */
export default function AuthResultPage({
  tone = "success",
  title,
  description,
  children,
}) {
  const { locale, setLocale, t } = useLanguage();
  const isError = tone === "error";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f6f5f8]">
      <header className="bg-red-700">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={t("home")}
          >
            <span className="relative h-11 w-11 shrink-0">
              <Image
                src="/Images/logo.png"
                alt=""
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </span>
            <span className="truncate text-lg font-bold text-white">
              {t("alfa_group")}
            </span>
          </Link>

          <button
            type="button"
            aria-label={
              locale === "ar"
                ? t("change_language_to_english")
                : t("change_language_to_arabic")
            }
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <MdLanguage className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[540px] rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24 ${
              isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            }`}
          >
            {isError ? (
              <FiAlertCircle
                className="h-11 w-11 sm:h-14 sm:w-14"
                aria-hidden="true"
              />
            ) : (
              <FiCheckCircle
                className="h-11 w-11 sm:h-14 sm:w-14"
                aria-hidden="true"
              />
            )}
          </div>

          <h1 className="mt-6 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            {title}
          </h1>

          {description ? (
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
              {description}
            </p>
          ) : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </main>
    </div>
  );
}
