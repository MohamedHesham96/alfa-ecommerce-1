"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowRight, FiLock, FiShield } from "react-icons/fi";

import { useLanguage } from "../../../context/LanguageContext";

const DEFAULT_REDIRECT_MS = 5000;
const EXIT_ANIMATION_MS = 520;

/**
 * Full-screen branded "not allowed" page.
 *
 * Used when a signed-in customer opens a route that belongs to another role.
 * It explains the state, returns to the storefront after five seconds, and
 * offers an immediate return button. The layout intentionally matches the
 * launch splash so the storefront keeps one visual language.
 */
export default function ForbiddenScreen({
  title,
  description,
  redirectTo = "/",
  durationMs = DEFAULT_REDIRECT_MS,
  actionLabel,
  countdownLabel,
  testId = "forbidden-screen",
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const rootRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const exitTimerRef = useRef(null);
  const closingRef = useRef(false);

  const [leaving, setLeaving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(1, Math.ceil(durationMs / 1000)),
  );

  const resolvedTitle = title ?? t("unauthorized_page");
  const resolvedDescription = description ?? t("forbidden_description");
  const resolvedAction = actionLabel ?? t("forbidden_back_home");
  const resolvedCountdown = countdownLabel ?? t("forbidden_redirect_prefix");

  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLeaving(true);

    exitTimerRef.current = window.setTimeout(() => {
      router.replace(redirectTo);
    }, EXIT_ANIMATION_MS);
  }, [redirectTo, router]);

  // Focus the page so assistive technology announces the alert immediately.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const focusTimer = window.setTimeout(() => {
      root.focus({ preventScroll: true });
    }, 80);

    return () => window.clearTimeout(focusTimer);
  }, []);

  // Count down and redirect after the same interval as the splash screen.
  useEffect(() => {
    const total = Math.max(0, durationMs);
    const startedAt = performance.now();
    let lastSecond = Math.max(1, Math.ceil(total / 1000));

    const tick = () => {
      const left = Math.max(0, total - (performance.now() - startedAt));
      const nextSecond = Math.ceil(left / 1000);

      if (nextSecond !== lastSecond && nextSecond > 0) {
        lastSecond = nextSecond;
        setSecondsLeft(nextSecond);
      }

      if (left <= 0) {
        finish();
      }
    };

    const interval = window.setInterval(tick, 250);
    const timeout = window.setTimeout(finish, total + 30);
    intervalRef.current = interval;
    timeoutRef.current = timeout;

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      intervalRef.current = null;
      timeoutRef.current = null;
    };
  }, [durationMs, finish]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [finish]);

  useEffect(
    () => () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      className={`splash-shell splash-shell--standalone forbidden-shell${leaving ? " is-leaving" : ""}`}
      style={{ "--splash-duration": `${durationMs}ms` }}
      role="alert"
      aria-labelledby="forbidden-title"
      aria-describedby="forbidden-description"
      tabIndex={-1}
      data-testid={testId}
    >
      <div className="splash-backdrop" aria-hidden="true">
        <span className="splash-orb splash-orb--a" />
        <span className="splash-orb splash-orb--b" />
        <span className="splash-glow" />
        <span className="splash-grid" />
        <span className="forbidden-code" dir="ltr">
          403
        </span>
      </div>

      <div className="splash-inner forbidden-inner">
        <p className="splash-eyebrow splash-enter splash-enter--1">
          <span className="splash-live-dot" aria-hidden="true" />
          <span>ALFA GROUP TECHNOLOGY</span>
        </p>

        <div className="splash-logo-stage forbidden-logo-stage splash-enter splash-enter--2">
          <span className="splash-ring splash-ring--1" aria-hidden="true" />
          <span className="splash-ring splash-ring--2" aria-hidden="true" />
          <span className="splash-logo-halo forbidden-logo-halo">
            <Image
              src="/Images/logo.png"
              alt=""
              width={88}
              height={88}
              className="h-[4.25rem] w-[4.25rem] object-contain drop-shadow-[0_12px_26px_rgba(255,46,70,0.42)] sm:h-20 sm:w-20"
              loading="eager"
              fetchPriority="high"
            />
          </span>
          <span className="forbidden-lock-badge" aria-hidden="true">
            <FiLock className="h-4 w-4" />
          </span>
        </div>

        <h1
          id="forbidden-title"
          className="splash-title forbidden-title splash-enter splash-enter--3"
        >
          {resolvedTitle}
        </h1>

        <p
          id="forbidden-description"
          className="splash-tagline splash-enter splash-enter--4"
        >
          {resolvedDescription}
        </p>

        <p className="forbidden-assurance splash-enter splash-enter--5">
          <FiShield aria-hidden="true" className="h-4 w-4" />
          <span>{t("forbidden_safe_note")}</span>
        </p>

        <div className="splash-footer splash-enter splash-enter--6">
          <div className="splash-progress" dir="ltr" aria-hidden="true">
            <span className="splash-progress-fill" />
          </div>

          <div className="splash-actions">
            <p className="splash-countdown" aria-hidden="true">
              <span>{resolvedCountdown}</span>
              <span className="splash-seconds-badge">
                {secondsLeft}
                <small>{t("splash_seconds_unit")}</small>
              </span>
            </p>

            <button
              type="button"
              onClick={finish}
              className="splash-skip group"
            >
              <span>{resolvedAction}</span>
              <FiArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 rtl:rotate-180"
              />
            </button>
          </div>

          <p className="sr-only" role="status" aria-live="polite">
            {t("forbidden_announce").replace(
              "{seconds}",
              String(Math.max(1, Math.ceil(durationMs / 1000))),
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
