"use client";

import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { useLanguage } from "../../context/LanguageContext";

export default function HomeSeoIntro() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="home-seo-title"
      className="mx-auto flex w-full items-start pt-6 sm:pt-12"
    >
      <div className="relative flex w-full flex-col self-stretch overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#fffafb_100%)] px-4 py-5 shadow-[0_24px_60px_-48px_rgba(56,24,35,0.45)] sm:px-7 sm:py-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-[#CD4354]/[0.06] blur-3xl"
        />

        <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span
              aria-hidden="true"
              className="mt-1 h-9 w-1 shrink-0 rounded-full bg-[#CD4354]"
            />
            <div className="min-w-0">
              <h1
                id="home-seo-title"
                className="text-[17px] font-semibold leading-7 text-[#20161a] sm:text-[19px]"
              >
                {t("home_seo_title")}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12px] leading-6 text-slate-600 sm:text-[13px]">
                {t("home_seo_description")}
              </p>
            </div>
          </div>

          <Link
            href="/products"
            prefetch={false}
            className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-[#CD4354] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#b53646] sm:mt-1"
          >
            {t("all_products")}
            <FiArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
