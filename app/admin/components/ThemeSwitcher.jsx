"use client";

import { MdDarkMode, MdLightMode } from "react-icons/md";

import { useLanguage } from "../../../context/LanguageContext.js";
import {
  ADMIN_THEME_DARK,
  ADMIN_THEME_LIGHT,
} from "../context/adminThemeConstants.js";
import { useAdminTheme } from "../context/AdminThemeContext.jsx";

/**
 * Two-state, accessible theme switcher for the admin top bar. The active state
 * is announced with aria-pressed and indicated visually by the selected pill.
 */
export default function ThemeSwitcher({ className = "" }) {
  const { t } = useLanguage();
  const { theme, setTheme } = useAdminTheme();
  const isLight = theme === ADMIN_THEME_LIGHT;
  const isDark = theme === ADMIN_THEME_DARK;

  return (
    <div
      className={`admin-theme-switcher ${className}`}
      role="group"
      aria-label={t("theme_switch")}
    >
      <button
        type="button"
        className={`admin-theme-option ${isLight ? "admin-theme-option--active" : ""}`}
        onClick={() => setTheme(ADMIN_THEME_LIGHT)}
        aria-pressed={isLight}
        title={t("theme_light")}
      >
        <MdLightMode aria-hidden="true" />
        <span className="admin-theme-option-label">{t("theme_light")}</span>
      </button>
      <button
        type="button"
        className={`admin-theme-option ${isDark ? "admin-theme-option--active" : ""}`}
        onClick={() => setTheme(ADMIN_THEME_DARK)}
        aria-pressed={isDark}
        title={t("theme_dark")}
      >
        <MdDarkMode aria-hidden="true" />
        <span className="admin-theme-option-label">{t("theme_dark")}</span>
      </button>
    </div>
  );
}
