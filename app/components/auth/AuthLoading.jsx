"use client";

import Image from "next/image";
import { useLanguage } from "../../../context/LanguageContext";

export default function AuthLoading() {
  const { t } = useLanguage();

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-[#f6f5f8] px-6"
      role="status"
      aria-live="polite"
    >
      <Image
        src="/Images/logo.png"
        alt=""
        className="h-24 w-24 animate-pulse"
        width={96}
        height={96}
        priority
      />
      <span className="text-sm font-medium text-gray-500">
        {t("loading") || "Loading..."}
      </span>
    </div>
  );
}
