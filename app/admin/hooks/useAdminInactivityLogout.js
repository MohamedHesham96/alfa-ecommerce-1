"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutRequest } from "../../../utils/requestsUtils";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE_LOGOUT = 30 * 1000; // 30 seconds before logout
const ACTIVITY_THROTTLE_MS = 1000; // At most one timer reset per second of activity

const AUTH_STORAGE_KEYS = [
  "accessToken",
  "refreshToken",
  "id",
  "firstName",
  "lastName",
  "address",
  "email",
  "phone",
  "role",
  "systemSettingsAccess",
  "username",
  "governorateId",
];

export function useAdminInactivityLogout(options = {}) {
  const router = useRouter();
  const {
    timeout = INACTIVITY_TIMEOUT,
    warningTime = WARNING_BEFORE_LOGOUT,
    showWarning = true,
    onWarning,
    onLogout,
  } = options;

  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(warningTime / 1000));
  const warningIntervalRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const showWarningModalRef = useRef(false);
  const logoutDeadlineRef = useRef(null);
  const onWarningRef = useRef(onWarning);
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onLogoutRef.current = onLogout;
  }, [onWarning, onLogout]);

  const setWarningVisible = useCallback((visible) => {
    showWarningModalRef.current = visible;
    setShowWarningModal(visible);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      return;
    }
    isLoggingOutRef.current = true;
    clearAllTimers();
    logoutDeadlineRef.current = null;
    setWarningVisible(false);

    try {
      if (typeof logoutRequest === "function") {
        await logoutRequest();
      }
    } catch {
      // Local sign-out must continue even if the server request fails.
      console.error(
        "Admin inactivity logout request failed; continuing with local sign-out.",
      );
    }

    if (typeof window !== "undefined") {
      AUTH_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
    }

    if (typeof onLogoutRef.current === "function") {
      onLogoutRef.current();
    }

    router.replace("/signin");
  }, [clearAllTimers, router, setWarningVisible]);

  const scheduleLogoutAtDeadline = useCallback(
    function scheduleLogoutCheck() {
      const deadline = logoutDeadlineRef.current;
      if (deadline === null) return;

      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        performLogout();
        return;
      }

      timeoutRef.current = setTimeout(scheduleLogoutCheck, remaining);
    },
    [performLogout],
  );

  const beginWarning = useCallback(() => {
    if (isLoggingOutRef.current) return;
    if (showWarningModalRef.current) return;

    const deadline = logoutDeadlineRef.current;
    if (deadline === null) return;

    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      performLogout();
      return;
    }

    setWarningVisible(true);
    setTimeLeft(Math.max(1, Math.ceil(remaining / 1000)));
    if (typeof onWarningRef.current === "function") {
      onWarningRef.current();
    }

    warningIntervalRef.current = setInterval(() => {
      const left = (logoutDeadlineRef.current ?? 0) - Date.now();
      if (left <= 0) {
        setTimeLeft(0);
        performLogout();
        return;
      }
      setTimeLeft(Math.ceil(left / 1000));
    }, 1000);

    scheduleLogoutAtDeadline();
  }, [performLogout, scheduleLogoutAtDeadline, setWarningVisible]);

  const scheduleWarningAtDeadline = useCallback(
    function scheduleWarningCheck() {
      const deadline = logoutDeadlineRef.current;
      if (deadline === null) return;

      const remaining = deadline - warningTime - Date.now();
      if (remaining <= 0) {
        beginWarning();
        return;
      }

      warningTimeoutRef.current = setTimeout(scheduleWarningCheck, remaining);
    },
    [beginWarning, warningTime],
  );

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setWarningVisible(false);

    if (typeof window === "undefined") return;

    logoutDeadlineRef.current = Date.now() + timeout;

    if (warningTime > 0 && warningTime < timeout) {
      scheduleWarningAtDeadline();
    } else {
      scheduleLogoutAtDeadline();
    }
  }, [
    clearAllTimers,
    scheduleLogoutAtDeadline,
    scheduleWarningAtDeadline,
    setWarningVisible,
    timeout,
    warningTime,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    let lastResetAt = Date.now();
    let trailingResetTimer = null;

    const resetForActivity = () => {
      lastResetAt = Date.now();
      resetTimer();
    };

    const handleActivity = () => {
      if (isLoggingOutRef.current) return;
      if (showWarningModalRef.current) {
        return;
      }

      const elapsed = Date.now() - lastResetAt;
      if (elapsed >= ACTIVITY_THROTTLE_MS) {
        if (trailingResetTimer !== null) {
          clearTimeout(trailingResetTimer);
          trailingResetTimer = null;
        }
        resetForActivity();
        return;
      }

      if (trailingResetTimer === null) {
        trailingResetTimer = setTimeout(() => {
          trailingResetTimer = null;
          if (isLoggingOutRef.current) return;
          if (showWarningModalRef.current) return;
          resetForActivity();
        }, ACTIVITY_THROTTLE_MS - elapsed);
      }
    };

    const handleResume = () => {
      if (isLoggingOutRef.current) return;

      const deadline = logoutDeadlineRef.current;
      if (deadline !== null) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          performLogout();
          return;
        }
        if (
          !showWarningModalRef.current &&
          warningTime > 0 &&
          warningTime < timeout &&
          remaining <= warningTime
        ) {
          beginWarning();
          return;
        }
      }

      if (showWarningModalRef.current) return;
      handleActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleResume();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleResume);

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleResume);
      if (trailingResetTimer !== null) {
        clearTimeout(trailingResetTimer);
        trailingResetTimer = null;
      }
      clearAllTimers();
    };
  }, [
    beginWarning,
    clearAllTimers,
    performLogout,
    resetTimer,
    timeout,
    warningTime,
  ]);

  const cancelWarningAndReset = useCallback(() => {
    if (isLoggingOutRef.current) return;
    setWarningVisible(false);
    resetTimer();
  }, [resetTimer, setWarningVisible]);

  const logoutNow = useCallback(() => {
    performLogout();
  }, [performLogout]);

  return {
    showWarningModal: showWarning && showWarningModal,
    timeLeft,
    cancelWarningAndReset,
    logoutNow,
    resetTimer,
  };
}

export default useAdminInactivityLogout;
