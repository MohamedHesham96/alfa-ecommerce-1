"use client";

import { FiCheckCircle, FiCircle } from "react-icons/fi";
import { useLanguage } from "../../../context/LanguageContext";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
} from "./authValidation";

export default function PasswordRequirements({
  id = "password-requirements",
  password = "",
  confirmPassword = "",
  showMatch = true,
  className = "",
}) {
  const { t } = useLanguage();

  const rules = [
    {
      key: "length",
      met:
        password.length >= AUTH_PASSWORD_MIN_LENGTH &&
        password.length <= AUTH_PASSWORD_MAX_LENGTH,
      label:
        t("authPasswordRuleLength") ||
        `Use ${AUTH_PASSWORD_MIN_LENGTH} to ${AUTH_PASSWORD_MAX_LENGTH} characters.`,
    },
  ];

  if (showMatch) {
    rules.push({
      key: "match",
      met:
        Boolean(password) &&
        Boolean(confirmPassword) &&
        password === confirmPassword,
      label: confirmPassword
        ? t("authPasswordRuleMatch") || "Passwords match."
        : t("authPasswordRuleMatchPending") || "Passwords must match.",
    });
  }

  return (
    <ul
      id={id}
      aria-live="polite"
      className={`mt-1.5 space-y-1 text-xs leading-5 text-gray-500 ${className}`}
    >
      {rules.map((rule) => (
        <li key={rule.key} className="flex items-center gap-1.5">
          {rule.met ? (
            <FiCheckCircle
              className="h-3.5 w-3.5 shrink-0 text-green-600"
              aria-hidden="true"
            />
          ) : (
            <FiCircle
              className="h-3.5 w-3.5 shrink-0 text-gray-400"
              aria-hidden="true"
            />
          )}
          <span className={rule.met ? "text-green-700" : undefined}>
            {rule.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
