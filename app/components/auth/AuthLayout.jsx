"use client";

import Image from "next/image";
import Link from "next/link";
import { FiAward, FiLock, FiShield, FiTruck } from "react-icons/fi";

import { useLanguage } from "../../../context/LanguageContext";

const FEATURES = [
  { key: "splash_feature_authentic", Icon: FiShield },
  { key: "splash_feature_warranty", Icon: FiAward },
  { key: "splash_feature_delivery", Icon: FiTruck },
];

/**
 * Premium split authentication layout.
 *
 * The form keeps its familiar light card for readability, while the page uses
 * the storefront's dark brand stage, glow, grid, and the same animated logo
 * treatment as the launch screen.
 */
export default function AuthLayout({ children }) {
  const { t } = useLanguage();

  return (
    <div className="auth-premium-shell relative min-h-[100dvh] w-full overflow-hidden bg-[#08040e]">
      <div className="splash-backdrop" aria-hidden="true">
        <span className="splash-orb splash-orb--a" />
        <span className="splash-orb splash-orb--b" />
        <span className="splash-glow" />
        <span className="splash-grid" />
        <Image
          src="/Images/logo.png"
          alt=""
          width={760}
          height={760}
          className="splash-watermark"
          aria-hidden="true"
          loading="eager"
          unoptimized
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1500px] flex-col lg:flex-row">
        <section className="relative flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:justify-center lg:px-10 lg:py-10 xl:px-16">
          <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col">
            <Link
              href="/"
              className="group mb-6 inline-flex w-fit items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8391]/60 lg:mb-8"
              aria-label={t("home")}
            >
              <span className="auth-brand-mark">
                <Image
                  src="/Images/logo.png"
                  alt=""
                  width={44}
                  height={44}
                  className="h-8 w-8 object-contain drop-shadow-[0_8px_18px_rgba(255,46,70,0.4)]"
                  loading="eager"
                  fetchPriority="high"
                  unoptimized
                />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-lg font-bold text-white">
                  {t("alfa_group")}
                </span>
                <span className="truncate text-[11px] font-medium tracking-wide text-white/45">
                  {t("auth_brand_tagline")}
                </span>
              </span>
            </Link>

            <div className="flex flex-1 flex-col justify-center">
              <div className="auth-card p-5 sm:p-7 lg:p-9">{children}</div>
            </div>

            <p className="auth-secure-line">
              <FiLock aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{t("auth_secure_note")}</span>
            </p>
          </div>
        </section>

        <aside className="auth-brand-panel relative hidden overflow-hidden lg:flex lg:min-h-[100dvh] lg:w-[44%] lg:items-center lg:justify-center lg:border-s lg:border-white/10 xl:w-[46%]">
          <div className="auth-brand-aura" aria-hidden="true" />

          <div className="relative z-10 flex w-full max-w-[32rem] flex-col items-center px-8 text-center xl:px-12">
            <p className="splash-eyebrow">
              <span className="splash-live-dot" aria-hidden="true" />
              <span>ALFA GROUP TECHNOLOGY</span>
            </p>

            <div className="splash-logo-stage auth-brand-logo-stage">
              <span className="splash-ring splash-ring--1" aria-hidden="true" />
              <span className="splash-ring splash-ring--2" aria-hidden="true" />
              <span className="splash-logo-halo">
                <Image
                  src="/Images/logo.png"
                  alt=""
                  width={96}
                  height={96}
                  className="h-20 w-20 object-contain drop-shadow-[0_12px_26px_rgba(255,46,70,0.42)]"
                  loading="eager"
                  unoptimized
                />
              </span>
            </div>

            <h2 className="splash-title auth-brand-title">
              {t("splash_brand_name")}{" "}
              <span className="splash-title-accent">
                {t("splash_brand_accent")}
              </span>
            </h2>

            <p className="splash-tagline">{t("splash_tagline")}</p>

            <ul className="splash-features">
              {FEATURES.map(({ key, Icon }) => (
                <li key={key} className="splash-chip">
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
