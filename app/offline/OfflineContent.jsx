"use client";

import Link from "next/link";
import Image from "next/image";
import { MdWifiOff } from "react-icons/md";

import { useLanguage } from "../../context/LanguageContext";

export default function OfflineContent() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f6f5f8] px-4 py-10">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_18px_60px_rgba(13,6,37,0.12)]">
        <div className="flex items-center justify-between gap-3 bg-[#0d0625] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 overflow-hidden rounded-xl bg-white">
              <Image
                src="/Images/logo.png"
                alt=""
                fill
                sizes="40px"
                className="object-contain p-1"
              />
            </span>
            <div>
              <p className="text-sm font-bold">{t("alfa_group")}</p>
              <p className="text-[11px] text-[#f2b4bc]">Alfa E-commerce</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-300">
            Alfa
          </span>
        </div>

        <div className="px-6 py-9 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-[#fdecee] text-[#CD4354]">
            <MdWifiOff aria-hidden="true" className="h-11 w-11" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {t("offline_title")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-gray-500">
            {t("offline_description")}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#E14A5C] px-6 text-sm font-bold text-white transition-colors hover:bg-[#CD4354]"
            >
              {t("offline_retry")}
            </Link>
            <Link
              href="/products"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-gray-300 px-6 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("offline_browse_products")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
