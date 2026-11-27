"use client";

import Image from "next/image";
import Link from "next/link";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { FaLeaf } from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiMapPin,
  FiPhoneCall,
  FiShoppingBag,
  FiTarget,
  FiUsers,
} from "react-icons/fi";
import { HiLightBulb } from "react-icons/hi";
import { IoHeart, IoShieldCheckmark } from "react-icons/io5";
import { TbTruckReturn } from "react-icons/tb";

import { useLanguage } from "../../../../context/LanguageContext";

const VALUES = [
  {
    icon: IoShieldCheckmark,
    titleKey: "about_quality_title",
    bodyKey: "about_quality_body",
    accent: "bg-rose-50 text-rose-600",
  },
  {
    icon: HiLightBulb,
    titleKey: "about_innovation_title",
    bodyKey: "about_innovation_body",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: IoHeart,
    titleKey: "about_customer_first_title",
    bodyKey: "about_customer_first_body",
    accent: "bg-sky-50 text-sky-600",
  },
  {
    icon: FaLeaf,
    titleKey: "about_sustainability_title",
    bodyKey: "about_sustainability_body",
    accent: "bg-emerald-50 text-emerald-600",
  },
];

const TEAM_ROLES = ["cto", "cto", "cto", "cto"];

function PolicyLines({ lines }) {
  const blocks = [];
  let paragraphs = [];
  let bullets = [];

  const flushParagraph = () => {
    if (!paragraphs.length) return;
    blocks.push({
      type: "paragraph",
      text: paragraphs.join(" "),
      key: `p-${blocks.length}`,
    });
    paragraphs = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push({
      type: "bullets",
      items: bullets,
      key: `u-${blocks.length}`,
    });
    bullets = [];
  };

  lines.forEach((line) => {
    if (line.startsWith("* ")) {
      flushParagraph();
      bullets.push(line.slice(2).trim());
    } else {
      flushBullets();
      paragraphs.push(line);
    }
  });

  flushParagraph();
  flushBullets();

  return (
    <>
      {blocks.map((block) =>
        block.type === "paragraph" ? (
          <p
            key={block.key}
            className="mt-2 text-sm leading-7 text-gray-600 sm:text-[15px] sm:leading-8"
          >
            {block.text}
          </p>
        ) : (
          <ul key={block.key} className="mt-2 space-y-1.5">
            {block.items.map((item, index) => (
              <li
                key={`${block.key}-${index}`}
                className="flex items-start gap-2 text-sm leading-7 text-gray-600 sm:text-[15px] sm:leading-8"
              >
                <span
                  className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d86b78]"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

function PolicyContent({ text }) {
  const blocks = String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (!lines.length) return null;

        const numbered = lines[0].match(/^(\d+)\.\s*(.+)$/);
        if (numbered) {
          const [, number, title] = numbered;
          return (
            <section
              key={`numbered-${blockIndex}`}
              className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#CD4354] text-xs font-bold text-white">
                  {number}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 sm:text-base">
                    {title}
                  </h4>
                  <PolicyLines lines={lines.slice(1)} />
                </div>
              </div>
            </section>
          );
        }

        const firstBullet = lines.findIndex((line) => line.startsWith("* "));
        if (firstBullet !== -1) {
          const heading = lines.slice(0, firstBullet).join(" ").trim();
          return (
            <div key={`bullets-${blockIndex}`}>
              {heading ? (
                <h4 className="text-sm font-bold text-gray-900 sm:text-base">
                  {heading}
                </h4>
              ) : null}
              <PolicyLines lines={lines.slice(firstBullet)} />
            </div>
          );
        }

        if (lines.length > 1 && lines[0].endsWith(":")) {
          return (
            <div key={`heading-${blockIndex}`}>
              <h4 className="text-sm font-bold text-gray-900 sm:text-base">
                {lines[0]}
              </h4>
              <PolicyLines lines={lines.slice(1)} />
            </div>
          );
        }

        return <PolicyLines key={`text-${blockIndex}`} lines={lines} />;
      })}
    </div>
  );
}

export default function About() {
  const { t, locale } = useLanguage();
  const NavArrow = locale === "ar" ? FiArrowLeft : FiArrowRight;

  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#fdf6f6]">
        <div
          className="pointer-events-none absolute -top-24 -end-24 h-72 w-72 rounded-full bg-[#f6c9cf]/60 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -start-24 h-80 w-80 rounded-full bg-[#f8d9b8]/50 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#CD4354]/15 bg-white px-4 py-1.5 text-xs font-bold text-[#CD4354] shadow-sm">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#CD4354]"
                aria-hidden="true"
              />
              {t("about_us")}
              <span className="text-gray-300" aria-hidden="true">
                |
              </span>
              {t("about_since")}
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[1.15] text-gray-900 sm:text-5xl lg:text-6xl">
              {t("about_hero_title_1")}
              <span className="mt-1 block text-[#CD4354]">
                {t("about_hero_title_2")}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-gray-600">
              {t("about_hero_subtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-[#CD4354] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#CD4354]/20 transition hover:-translate-y-0.5 hover:bg-[#b53a49] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/40 focus-visible:ring-offset-2"
              >
                <FiShoppingBag aria-hidden="true" />
                {t("shopNow")}
              </Link>
              <a
                href="#Guarantee_Policy"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-[#CD4354]/30 hover:text-[#CD4354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354]/30"
              >
                <AiFillSafetyCertificate aria-hidden="true" />
                {t("Guarantee_Policy")}
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute inset-6 rounded-[2.5rem] bg-[#CD4354]/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white p-3 shadow-2xl shadow-[#CD4354]/10">
              <div className="overflow-hidden rounded-[2rem] bg-[#f7f7f5]">
                <Image
                  src="/Images/23@4x.png"
                  alt={t("about_us_image")}
                  width={560}
                  height={560}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="absolute -bottom-5 start-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl sm:start-8">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {t("about_since")}
              </p>
              <p className="text-xl font-black text-gray-900">2010</p>
            </div>

            <div className="absolute -top-4 end-4 inline-flex items-center gap-2 rounded-full bg-[#CD4354] px-4 py-2 text-xs font-bold text-white shadow-lg">
              <FiAward aria-hidden="true" />
              {t("about_trusted")}
            </div>
          </div>
        </div>
      </section>

      {/* Who we are + mission */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff5f6] text-xl text-[#CD4354]">
              <FiUsers aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {t("about_who_title")}
            </h2>
            <p className="mt-3 text-sm leading-8 text-gray-600 sm:text-base">
              {t("about_who_body")}
            </p>
          </article>

          <div className="grid gap-5">
            <article className="relative overflow-hidden rounded-3xl bg-[#1f1a1b] p-6 text-white shadow-lg sm:p-7">
              <div
                className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-[#CD4354]/30 blur-2xl"
                aria-hidden="true"
              />
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl text-[#ffb3bd]">
                <FiTarget aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-bold">
                {t("about_mission_title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                {t("about_mission_body")}
              </p>
            </article>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-gray-100 bg-[#faf7f7] p-5">
                <FiAward
                  className="text-xl text-[#CD4354]"
                  aria-hidden="true"
                />
                <p className="mt-3 text-2xl font-black text-gray-900">2010</p>
                <p className="text-xs font-semibold text-gray-500">
                  {t("about_since")}
                </p>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-[#faf7f7] p-5">
                <FiMapPin
                  className="text-xl text-[#CD4354]"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-bold text-gray-900">
                  {t("about_reach_title")}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {t("about_reach_body")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="scroll-mt-24 bg-[#f5f2ef] py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#CD4354] shadow-sm">
              <IoShieldCheckmark aria-hidden="true" />
              {t("Guarantee_Policy")} &amp; {t("Return_Policy")}
            </span>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              {t("about_policies_title")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              {t("about_policies_subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit lg:sticky lg:top-24">
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {t("about_on_this_page")}
                </p>
                <nav className="mt-3 space-y-1.5">
                  <a
                    href="#Guarantee_Policy"
                    className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-[#fff5f6] hover:text-[#CD4354]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff5f6] text-[#CD4354]">
                      <AiFillSafetyCertificate aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      {t("Guarantee_Policy")}
                    </span>
                    <NavArrow
                      className="text-xs opacity-0 transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </a>
                  <a
                    href="#Return_Policy"
                    className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 transition hover:bg-[#fff5f6] hover:text-[#CD4354]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff5f6] text-[#CD4354]">
                      <TbTruckReturn aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      {t("Return_Policy")}
                    </span>
                    <NavArrow
                      className="text-xs opacity-0 transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </a>
                </nav>

                <div className="mt-4 rounded-2xl bg-[#1f1a1b] p-4 text-white">
                  <FiPhoneCall
                    className="text-lg text-[#ffb3bd]"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-sm font-bold">
                    {t("about_need_help")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/60">
                    {t("about_need_help_body")}
                  </p>
                  <a
                    href="#footer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#CD4354] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#b53a49]"
                  >
                    {t("contact_us")}
                  </a>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <article
                id="Guarantee_Policy"
                className="scroll-mt-28 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
              >
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff5f6] text-2xl text-[#CD4354]">
                      <AiFillSafetyCertificate aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {t("Guarantee_Policy")}
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {t("about_warranty_badge")}
                  </span>
                </header>
                <div className="pt-5">
                  <PolicyContent text={t("about_guarantee_body")} />
                </div>
              </article>

              <article
                id="Return_Policy"
                className="scroll-mt-28 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
              >
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff5f6] text-2xl text-[#CD4354]">
                      <TbTruckReturn aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {t("Return_Policy")}
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    {t("about_return_badge")}
                  </span>
                </header>
                <div className="pt-5">
                  <PolicyContent text={t("about_return_body")} />
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {t("about_values_title")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              {t("about_values_subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <article
                  key={value.titleKey}
                  className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#CD4354]/20 hover:shadow-lg"
                >
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${value.accent}`}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-gray-900">
                    {t(value.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-gray-500">
                    {t(value.bodyKey)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-[#faf7f7] py-14 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {t("about_team_title")}
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              {t("about_team_subtitle")}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {TEAM_ROLES.map((roleKey, index) => (
              <article
                key={`${roleKey}-${index}`}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  <Image
                    src="/Images/unnamed.png"
                    alt={t("team_member_photo")}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-sm font-bold">Julian Thorne</p>
                    <p className="text-xs text-white/70">{t(roleKey)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white pb-16 pt-4 sm:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#CD4354] px-6 py-10 text-center text-white sm:px-10">
            <div
              className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-20 -start-10 h-48 w-48 rounded-full bg-black/10 blur-2xl"
              aria-hidden="true"
            />
            <h2 className="relative text-2xl font-bold sm:text-3xl">
              {t("about_cta_title")}
            </h2>
            <p className="relative mx-auto mt-2 max-w-xl text-sm leading-7 text-white/80">
              {t("about_cta_body")}
            </p>
            <Link
              href="/"
              className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#CD4354] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#fff5f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#CD4354]"
            >
              <FiShoppingBag aria-hidden="true" />
              {t("shopNow")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
