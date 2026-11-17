"use client";

import { MdLanguage } from "react-icons/md";
import { useLanguage } from "../../../context/LanguageContext";

export default function AuthHeading({
  id,
  title,
  description,
  showLanguageToggle = true,
  className = "",
  as: HeadingTag = "h2",
}) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <HeadingTag
          id={id}
          className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl"
        >
          {title}
        </HeadingTag>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        ) : null}
      </div>

      {showLanguageToggle ? (
        <button
          type="button"
          aria-label={
            locale === "ar"
              ? t("change_language_to_english")
              : t("change_language_to_arabic")
          }
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <MdLanguage className="h-4 w-4" aria-hidden="true" />
          <span aria-hidden="true">{locale === "ar" ? "EN" : "AR"}</span>
        </button>
      ) : null}
    </div>
  );
}
