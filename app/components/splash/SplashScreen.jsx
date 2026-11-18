"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowRight, FiAward, FiShield, FiTruck } from "react-icons/fi";

import { useLanguage } from "../../../context/LanguageContext";
import {
  SPLASH_DURATION_MS,
  SPLASH_HTML_ATTR,
  markSplashSeen,
} from "../../../lib/splash";

const EXIT_ANIMATION_MS = 520;

const FEATURES = [
  { key: "splash_feature_authentic", Icon: FiShield },
  { key: "splash_feature_warranty", Icon: FiAward },
  { key: "splash_feature_delivery", Icon: FiTruck },
];

/**
 * Branded launch screen.
 *
 * mode="overlay" covers the homepage and reveals it when the timer ends.
 * mode="page" is used by the standalone /welcome route and navigates to
 * `redirectTo` when the timer ends.
 */
export default function SplashScreen({
  durationMs = SPLASH_DURATION_MS,
  mode = "overlay",
  redirectTo = "/",
  onDone,
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const rootRef = useRef(null);
  const skipRef = useRef(null);
  const onDoneRef = useRef(onDone);
  const intervalRef = useRef(null);
  const exitTimerRef = useRef(null);
  const startedAtRef = useRef(null);
  const closingRef = useRef(false);

  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(1, Math.ceil(durationMs / 1000)),
  );

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Overlay mode is gated by the pre-paint boot script. If it reports that the
  // splash should stay hidden, remove it without stealing focus or scrolling.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    if (mode === "overlay") {
      const bootState = document.documentElement.getAttribute(SPLASH_HTML_ATTR);
      if (bootState !== "on") {
        onDoneRef.current?.("hidden");
        return undefined;
      }
    }

    if (startedAtRef.current == null) {
      const bootStartedAt =
        mode === "overlay"
          ? window.__alfaSplashStartedAt
          : window.__alfaSplashPageStartedAt;
      startedAtRef.current =
        typeof bootStartedAt === "number" ? bootStartedAt : performance.now();
    }

    if (mode === "overlay") {
      delete window.__alfaSplashStartedAt;
    } else {
      delete window.__alfaSplashPageStartedAt;
    }

    setActive(true);
    window.__alfaSplashHydrated = true;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (!closingRef.current) {
        root.focus({ preventScroll: true });
      }
    }, 120);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [mode]);

  const finish = useCallback(
    (reason = "auto") => {
      if (closingRef.current) return;
      closingRef.current = true;

      markSplashSeen();

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      document.documentElement.setAttribute(SPLASH_HTML_ATTR, "off");

      setLeaving(true);

      exitTimerRef.current = window.setTimeout(() => {
        if (mode === "page") {
          router.replace(redirectTo);
        }
        onDoneRef.current?.(reason);
      }, EXIT_ANIMATION_MS);
    },
    [mode, redirectTo, router],
  );

  // Countdown and progress are driven by wall-clock time so a background tab
  // still completes at the right moment instead of restarting on focus.
  useEffect(() => {
    if (!active) return undefined;

    const total = Math.max(0, durationMs);
    const startedAt = startedAtRef.current ?? performance.now();
    let lastSecond = 0;

    const tick = () => {
      const left = Math.max(0, total - (performance.now() - startedAt));
      const nextSecond = Math.max(0, Math.ceil(left / 1000));

      if (nextSecond !== lastSecond && nextSecond > 0) {
        lastSecond = nextSecond;
        setSecondsLeft(nextSecond);
      }

      if (left <= 0) {
        window.clearInterval(interval);
        intervalRef.current = null;
        finish("auto");
      }
    };

    const interval = window.setInterval(tick, 80);
    intervalRef.current = interval;
    tick();

    return () => {
      window.clearInterval(interval);
      intervalRef.current = null;
    };
  }, [active, durationMs, finish]);

  useEffect(
    () => () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    },
    [],
  );

  // Keep the single-action intro keyboard-safe even before the root receives
  // focus: Escape exits immediately and Tab cannot reach the covered page.
  useEffect(() => {
    if (!active) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish("escape");
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, finish]);

  return (
    <div
      ref={rootRef}
      data-splash-root=""
      data-splash-mode={mode}
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
      aria-describedby="splash-description"
      tabIndex={-1}
      style={{ "--splash-duration": `${durationMs}ms` }}
      className={`splash-shell${leaving ? " is-leaving" : ""}`}
    >
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

      <div className="splash-inner">
        <p className="splash-eyebrow splash-enter splash-enter--1">
          <span className="splash-live-dot" aria-hidden="true" />
          <span>ALFA GROUP TECHNOLOGY</span>
        </p>

        <div className="splash-logo-stage splash-enter splash-enter--2">
          <span className="splash-ring splash-ring--1" aria-hidden="true" />
          <span className="splash-ring splash-ring--2" aria-hidden="true" />
          <span className="splash-logo-halo">
            <Image
              src="/Images/logo.png"
              alt=""
              width={88}
              height={88}
              className="h-[4.25rem] w-[4.25rem] object-contain drop-shadow-[0_12px_26px_rgba(255,46,70,0.42)] sm:h-20 sm:w-20"
              loading="eager"
              fetchPriority="high"
              unoptimized
            />
          </span>
        </div>

        <h1
          id="splash-title"
          className="splash-title splash-enter splash-enter--3"
        >
          {t("splash_brand_name")}{" "}
          <span className="splash-title-accent">
            {t("splash_brand_accent")}
          </span>
        </h1>

        <p
          id="splash-description"
          className="splash-tagline splash-enter splash-enter--4"
        >
          {t("splash_tagline")}
        </p>

        <ul className="splash-features splash-enter splash-enter--5">
          {FEATURES.map(({ key, Icon }) => (
            <li key={key} className="splash-chip">
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        <div className="splash-footer splash-enter splash-enter--6">
          <div className="splash-progress" dir="ltr" aria-hidden="true">
            <span className="splash-progress-fill" />
          </div>

          <div className="splash-actions">
            <p className="splash-countdown" aria-hidden="true">
              <span>{t("splash_redirect_prefix")}</span>
              <span className="splash-seconds-badge">
                {secondsLeft}
                <small>{t("splash_seconds_unit")}</small>
              </span>
            </p>

            <button
              ref={skipRef}
              type="button"
              onClick={() => finish("skip")}
              data-splash-skip=""
              data-splash-redirect={mode === "page" ? redirectTo : undefined}
              className="splash-skip group"
              aria-label={t("splash_skip_aria")}
            >
              <span>{t("splash_skip")}</span>
              <FiArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 rtl:rotate-180"
              />
            </button>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {t("splash_announce").replace(
              "{seconds}",
              String(Math.max(1, Math.ceil(durationMs / 1000))),
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
