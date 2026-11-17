"use client";

import { useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import useAdminInactivityLogout from "../hooks/useAdminInactivityLogout";

export default function AdminInactivityHandler({ children, showWarning = true }) {
  const { t } = useLanguage();
  const { showWarningModal, timeLeft, cancelWarningAndReset, logoutNow } =
    useAdminInactivityLogout({ showWarning });

  return (
    <>
      {children}
      {showWarning && showWarningModal && (
        <div className="admin-modal-overlay z-[9999]">
          <div className="admin-modal max-w-md">
            <div className="admin-modal-body">
              <h2 className="admin-modal-title mb-3">
                {t("session_expiring_title")}
              </h2>
              <p className="mb-6 text-sm leading-6 text-[var(--admin-muted)]">
                {t("session_expiring_message").replace(
                  "{seconds}",
                  `${timeLeft} ${t(timeLeft === 1 ? "second" : "seconds")}`,
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={logoutNow}
                  className="admin-btn admin-btn-secondary"
                >
                  {t("logout_now")}
                </button>
                <button
                  type="button"
                  onClick={cancelWarningAndReset}
                  className="admin-btn admin-btn-danger-solid"
                >
                  {t("stay_logged_in")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
