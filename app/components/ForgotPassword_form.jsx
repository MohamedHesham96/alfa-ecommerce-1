"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MdEmail } from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";

import { useLanguage } from "../../context/LanguageContext";
import { postRequest, putRequest } from "../../utils/requestsUtils";
import { reportApiFailure } from "../../utils/connectivityStore";

import AuthHeading from "./auth/AuthHeading";
import { AuthInput } from "./auth/AuthField";
import AuthLayout from "./auth/AuthLayout";
import AuthSubmitButton from "./auth/AuthSubmitButton";
import FormAlert from "./auth/FormAlert";
import PasswordRequirements from "./auth/PasswordRequirements";
import {
  AUTH_EMAIL_PATTERN,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  extractAuthErrors,
  getPasswordByteLength,
  isBlank,
  pickAuthFieldErrors,
} from "./auth/authValidation";

export default function ForgotPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [success, setSuccess] = useState("");

  const emailRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const requiredMessage =
    t("authFieldRequired") || "This field is required.";

  const validateEmail = (value = email) => {
    if (isBlank(value)) return requiredMessage;
    return AUTH_EMAIL_PATTERN.test(value.trim())
      ? ""
      : t("authInvalidEmail") || "Enter a valid email address.";
  };

  const validateNewPassword = (value = newPassword) => {
    if (!value) return requiredMessage;
    if (
      value.length < AUTH_PASSWORD_MIN_LENGTH ||
      value.length > AUTH_PASSWORD_MAX_LENGTH
    ) {
      return (
        t("authPasswordLength") ||
        `Password must be ${AUTH_PASSWORD_MIN_LENGTH} to ${AUTH_PASSWORD_MAX_LENGTH} characters long.`
      );
    }
    if (getPasswordByteLength(value) > 72) {
      return (
        t("authPasswordByteLimit") ||
        "Password is too long. Use fewer characters."
      );
    }
    return "";
  };

  const validateConfirmPassword = (value = confirmPassword) => {
    if (!value) return requiredMessage;
    return value === newPassword
      ? ""
      : t("passwordMismatch") || "Passwords do not match.";
  };

  const applyBackendError = (error, knownFields, tokenMayBeInvalid = false) => {
    const extracted = extractAuthErrors(error, t);
    const { fieldErrors: mapped, fallbackGeneral } = pickAuthFieldErrors(
      extracted.fieldErrors,
      knownFields,
    );

    let general = extracted.generalError || fallbackGeneral;

    if (tokenMayBeInvalid && mapped.token) {
      general = mapped.token;
      setTokenError(true);
      delete mapped.token;
    }

    if (Object.keys(mapped).length > 0) {
      setFieldErrors((previous) => ({ ...previous, ...mapped }));
      setTouched((previous) => {
        const next = { ...previous };
        Object.keys(mapped).forEach((field) => {
          next[field] = true;
        });
        return next;
      });

      const firstField = Object.keys(mapped)[0];
      if (firstField === "email") emailRef.current?.focus();
      if (firstField === "newPassword") newPasswordRef.current?.focus();
      if (firstField === "confirmPassword") {
        confirmPasswordRef.current?.focus();
      }
    }

    if (general) setGeneralError(general);
  };

  const requestReset = async (event) => {
    event.preventDefault();
    if (loading) return;

    setGeneralError("");
    setSuccess("");

    const emailError = validateEmail();
    setTouched((previous) => ({ ...previous, email: true }));
    setFieldErrors((previous) => ({ ...previous, email: emailError }));

    if (emailError) {
      emailRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      await postRequest(
        "/api/auth/forgot-password",
        { email: email.trim() },
        "",
        false,
        { suppressErrorToast: true },
      );
      setSuccess(
        t("forgotPasswordEmailSent") ||
          "If an account with that email exists, a reset link has been sent.",
      );
      setEmail("");
    } catch (error) {
      reportApiFailure(error);
      applyBackendError(error, ["email"]);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (loading) return;

    setGeneralError("");
    setSuccess("");
    setTokenError(false);

    if (!token) {
      setTokenError(true);
      setGeneralError(
        t("invalidResetLink") || "The reset link is invalid or missing.",
      );
      return;
    }

    const nextErrors = {
      newPassword: validateNewPassword(),
      confirmPassword: validateConfirmPassword(),
    };

    setTouched({ newPassword: true, confirmPassword: true });
    setFieldErrors(nextErrors);

    if (nextErrors.newPassword) {
      newPasswordRef.current?.focus();
      return;
    }
    if (nextErrors.confirmPassword) {
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      await putRequest(
        "/api/auth/rest-forget-password",
        {
          token,
          newPassword,
          repeatPassword: confirmPassword,
        },
        "",
        { suppressErrorToast: true, suppressSuccessToast: true },
      );
      setSuccess(
        t("resetSuccess") ||
          "Password updated successfully. You can now sign in.",
      );
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
      setTouched({});
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/forgotpassword");
      }
    } catch (error) {
      reportApiFailure(error);
      applyBackendError(
        error,
        ["newPassword", "confirmPassword", "token"],
        true,
      );
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="w-full">
      <AuthHeading
        id="auth-forgot-title"
        as="h1"
        title={
          token
            ? t("resetPasswordTitle") || "Reset your password"
            : t("forgotPassword") || "Forgot password"
        }
        description={
          token
            ? t("authResetPasswordDescription")
            : t("reset_password_helper")
        }
      />

      <div className="mt-6">
        {success ? (
          <div className="space-y-5">
            <FormAlert tone="success">{success}</FormAlert>
            <Link
              href="/signin"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
            >
              {t("backToSignIn") || "Back to sign in"}
            </Link>
          </div>
        ) : token ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={resetPassword}
            noValidate
            aria-busy={loading || undefined}
          >
            {generalError ? (
              <div className="space-y-2">
                <FormAlert>{generalError}</FormAlert>
                {tokenError ? (
                  <Link
                    href="/forgotpassword"
                    className="inline-block text-sm font-semibold text-red-600 underline underline-offset-2 transition hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    {t("authRequestNewResetLink")}
                  </Link>
                ) : null}
              </div>
            ) : null}

            <AuthInput
              id="reset-new-password"
              inputRef={newPasswordRef}
              label={t("newPassword") || "New password"}
              type="password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setGeneralError("");
                if (touched.newPassword) {
                  setFieldErrors((previous) => ({
                    ...previous,
                    newPassword: validateNewPassword(event.target.value),
                  }));
                }
                if (touched.confirmPassword) {
                  setFieldErrors((previous) => ({
                    ...previous,
                    confirmPassword:
                      event.target.value === confirmPassword
                        ? ""
                        : t("passwordMismatch") ||
                          "Passwords do not match.",
                  }));
                }
              }}
              onBlur={() => {
                setTouched((previous) => ({
                  ...previous,
                  newPassword: true,
                }));
                setFieldErrors((previous) => ({
                  ...previous,
                  newPassword: validateNewPassword(),
                }));
              }}
              error={
                touched.newPassword ? fieldErrors.newPassword : ""
              }
              autoComplete="new-password"
              enterKeyHint="next"
              disabled={loading}
              required
            />

            <AuthInput
              id="reset-confirm-password"
              inputRef={confirmPasswordRef}
              label={t("confirmPassword") || "Confirm password"}
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setGeneralError("");
                if (touched.confirmPassword) {
                  setFieldErrors((previous) => ({
                    ...previous,
                    confirmPassword:
                      event.target.value === newPassword
                        ? ""
                        : t("passwordMismatch") ||
                          "Passwords do not match.",
                  }));
                }
              }}
              onBlur={() => {
                setTouched((previous) => ({
                  ...previous,
                  confirmPassword: true,
                }));
                setFieldErrors((previous) => ({
                  ...previous,
                  confirmPassword: validateConfirmPassword(),
                }));
              }}
              error={
                touched.confirmPassword
                  ? fieldErrors.confirmPassword
                  : ""
              }
              autoComplete="new-password"
              enterKeyHint="done"
              disabled={loading}
              required
            />

            <PasswordRequirements
              password={newPassword}
              confirmPassword={confirmPassword}
            />

            <AuthSubmitButton
              loading={loading}
              label={t("save") || "Save"}
              loadingLabel={t("saving") || "Saving..."}
              className="mt-2"
            />
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={requestReset}
            noValidate
            aria-busy={loading || undefined}
          >
            {generalError ? <FormAlert>{generalError}</FormAlert> : null}

            <AuthInput
              id="forgot-email"
              inputRef={emailRef}
              label={t("email") || "Email"}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setGeneralError("");
                if (touched.email) {
                  setFieldErrors((previous) => ({
                    ...previous,
                    email: validateEmail(event.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setTouched((previous) => ({ ...previous, email: true }));
                setFieldErrors((previous) => ({
                  ...previous,
                  email: validateEmail(),
                }));
              }}
              error={touched.email ? fieldErrors.email : ""}
              icon={<MdEmail />}
              placeholder={t("email")}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="send"
              disabled={loading}
              required
            />

            <AuthSubmitButton
              loading={loading}
              label={t("send") || "Send reset link"}
              loadingLabel={t("sending") || "Sending..."}
              className="mt-2"
            />
          </form>
        )}

        {!success ? (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-gray-500 transition hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <FiArrowLeft
                className="h-4 w-4 rtl:rotate-180"
                aria-hidden="true"
              />
              {t("backToSignIn") || "Back to sign in"}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );

  return <AuthLayout>{content}</AuthLayout>;
}
