"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * Split authentication layout that keeps the existing Alfa Group artwork and
 * brand colors. The artwork fills the panel on large screens; smaller screens
 * get the form first with a compact brand lockup.
 */
export default function AuthLayout({
  children,
  imageSrc = "/Images/imageSignUp.png",
}) {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] w-full bg-[#f6f5f8]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1500px] flex-col lg:flex-row">
        <section className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:justify-center lg:px-10 lg:py-10 xl:px-16">
          <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col">
            <Link
              href="/"
              className="mb-6 inline-flex w-fit items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 lg:mb-8"
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
              <span className="text-lg font-bold text-[#0d0625]">
                {t("alfa_group")}
              </span>
            </Link>

            <div className="flex flex-1 flex-col justify-center">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">
                {children}
              </div>
            </div>

            <div className="mt-6 h-1 lg:mt-8" aria-hidden="true" />
          </div>
        </section>

        <aside className="relative hidden w-full overflow-hidden bg-[#0d0625] lg:block lg:min-h-[100dvh] lg:w-[44%] xl:w-[46%]">
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(min-width: 1024px) 46vw, 0px"
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0d0625]/45 via-transparent to-transparent"
            aria-hidden="true"
          />
        </aside>
      </div>
    </div>
  );
}
