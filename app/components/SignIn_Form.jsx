"use client";

import { useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdEmail } from "react-icons/md";
import { FaUserLarge } from "react-icons/fa6";
import { toast } from "react-toastify";

import { useLanguage } from "../../context/LanguageContext";
import { useFeature } from "../../context/AppConfigContext";
import { reportApiFailure } from "../../utils/connectivityStore";
import { resolveLanguage } from "../../utils/languageUtils";
import { postRequest } from "../../utils/requestsUtils";
import { clearUserScopedCaches } from "../../lib/pwa/client";
import { notifyAuthChanged } from "../../utils/authEvents";
import { getReturnUrlFromLocation } from "../../utils/authRedirect";

import AuthHeading from "./auth/AuthHeading";
import { AuthInput as AuthTextField } from "./auth/AuthField";
import AuthLayout from "./auth/AuthLayout";
import AuthSubmitButton from "./auth/AuthSubmitButton";
import FormAlert from "./auth/FormAlert";
import {
  AUTH_EMAIL_PATTERN,
  extractAuthErrors,
  isBlank,
  pickAuthFieldErrors,
} from "./auth/authValidation";

export default function SignIn({
  popUp,
  setShowSignUp,
  setShowSignIn,
  setOpenForm,
}) {
  const router = useRouter();
  const { setLocale, t } = useLanguage();
  const registrationEnabled = useFeature(
    "features.customerRegistration.enabled",
  );

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const forgotEmailRef = useRef(null);

  const requiredMessage =
    t("authFieldRequired") || "This field is required.";

  const focusFirstError = (errors) => {
    if (errors.username) {
      usernameRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }
    if (errors.email) {
      forgotEmailRef.current?.focus();
    }
  };

  const validateLogin = () => {
    const nextErrors = {
      username: isBlank(username) ? requiredMessage : "",
      password: password ? "" : requiredMessage,
    };

    setFieldErrors(nextErrors);
    setTouched({ username: true, password: true });

    if (nextErrors.username || nextErrors.password) {
      focusFirstError(nextErrors);
      return false;
    }

    return true;
  };

  const validateForgotEmail = (value = forgotEmail) => {
    if (isBlank(value)) return requiredMessage;
    if (!AUTH_EMAIL_PATTERN.test(value.trim())) {
      return t("authInvalidEmail") || "Enter a valid email address.";
    }
    return "";
  };

  const applyBackendError = (error, knownFields) => {
    const extracted = extractAuthErrors(error, t);
    const { fieldErrors: mapped, fallbackGeneral } = pickAuthFieldErrors(
      extracted.fieldErrors,
      knownFields,
    );

    if (Object.keys(mapped).length > 0) {
      setFieldErrors((previous) => ({ ...previous, ...mapped }));
      setTouched((previous) => {
        const next = { ...previous };
        Object.keys(mapped).forEach((field) => {
          next[field] = true;
        });
        return next;
      });
      focusFirstError(mapped);
    }

    const general = extracted.generalError || fallbackGeneral;
    if (general) setGeneralError(general);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loading) return;

    setGeneralError("");
    if (!validateLogin()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
        {
          username,
          password,
        },
        {},
      );

      toast.success(response.data.message);

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("id", response.data.userDetails.userId);
      localStorage.setItem("firstName", response.data.userDetails.firstName);

      const language = resolveLanguage(response.data.userDetails.language);
      localStorage.setItem("lang", language);
      setLocale(language);
      localStorage.setItem("role", response.data.userDetails.role);

      if (
        response.data.userDetails.role === "ADMIN" &&
        (response.data.userDetails.themePreference === "DARK" ||
          response.data.userDetails.themePreference === "LIGHT")
      ) {
        // Per-admin rendering hint for the admin dashboard only. The backend
        // value remains authoritative and is reloaded when the dashboard
        // opens; customer accounts never read this key.
        localStorage.setItem(
          `adminThemePreference:${response.data.userDetails.userId}`,
          response.data.userDetails.themePreference,
        );
      }

      localStorage.setItem(
        "systemSettingsAccess",
        String(response.data.userDetails.systemSettingsAccess === true),
      );

      const governorateId =
        response.data.userDetails.governorate?.governorateId;
      if (governorateId !== undefined && governorateId !== null) {
        localStorage.setItem("governorateId", governorateId);
      } else {
        localStorage.removeItem("governorateId");
      }

      // Let the shared header (name, default address, cart badge) and route
      // guards pick up the fresh session without waiting for a page reload.
      notifyAuthChanged();

      // A different account may be signing in on this device. Drop any
      // previously cached page/API data before navigating.
      await clearUserScopedCaches().catch(() => {});

      // A protected page (for example an order link opened from an email)
      // sends the user here with its full URL. Resume it before applying the
      // normal role-based defaults. Route guards still enforce permissions.
      const returnUrl = getReturnUrlFromLocation();
      if (returnUrl) {
        router.replace(returnUrl);
      } else if (response.data.userDetails.role === "ADMIN") {
        router.replace("/admin/Dashboard");
      } else if (popUp) {
        router.refresh();
        setOpenForm?.(false);
      } else {
        router.replace("/");
      }
    } catch (error) {
      reportApiFailure(error);
      applyBackendError(error, ["username", "password"]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotPasswordEmail = async (event) => {
    event.preventDefault();
    if (loading) return;

    setGeneralError("");
    setForgotSuccess("");

    const emailError = validateForgotEmail();
    setFieldErrors((previous) => ({ ...previous, email: emailError }));
    setTouched((previous) => ({ ...previous, email: true }));

    if (emailError) {
      forgotEmailRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      await postRequest(
        "/api/auth/forgot-password",
        { email: forgotEmail.trim() },
        "",
        false,
        { suppressErrorToast: true },
      );
      setForgotSuccess(
        t("forgotPasswordEmailSent") ||
          "If an account with that email exists, a reset link has been sent.",
      );
    } catch (error) {
      applyBackendError(error, ["email"]);
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setMode("forgot");
    setGeneralError("");
    setFieldErrors({});
    setTouched({});
    setForgotSuccess("");
    window.requestAnimationFrame(() => forgotEmailRef.current?.focus());
  };

  const closeForgotPassword = () => {
    setMode("login");
    setGeneralError("");
    setFieldErrors({});
    setTouched({});
    setForgotSuccess("");
    window.requestAnimationFrame(() => usernameRef.current?.focus());
  };

  const content = (
    <div className="w-full">
      <AuthHeading
        id="auth-signin-title"
        as={popUp ? "h2" : "h1"}
        title={
          mode === "forgot" ? t("resetPasswordTitle") : t("welcomeBack")
        }
        description={
          mode === "forgot" ? t("reset_password_helper") : t("welcomeMessage")
        }
        className={popUp ? "pe-10" : ""}
      />

      {mode === "login" ? (
        <form
          id="form_login"
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleLogin}
          noValidate
          aria-busy={loading || undefined}
        >
          {generalError ? <FormAlert>{generalError}</FormAlert> : null}

          <AuthTextField
            id="signin-username"
            inputRef={usernameRef}
            label={t("username")}
            placeholder={t("username")}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setGeneralError("");
              if (touched.username) {
                setFieldErrors((previous) => ({
                  ...previous,
                  username: isBlank(event.target.value)
                    ? requiredMessage
                    : "",
                }));
              }
            }}
            onBlur={() => {
              setTouched((previous) => ({ ...previous, username: true }));
              setFieldErrors((previous) => ({
                ...previous,
                username: isBlank(username) ? requiredMessage : "",
              }));
            }}
            error={touched.username ? fieldErrors.username : ""}
            icon={<FaUserLarge />}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            disabled={loading}
            data-autofocus
            required
          />

          <div>
            <AuthTextField
              id="signin-password"
              inputRef={passwordRef}
              label={t("password")}
              placeholder={t("password")}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setGeneralError("");
                if (touched.password) {
                  setFieldErrors((previous) => ({
                    ...previous,
                    password: event.target.value ? "" : requiredMessage,
                  }));
                }
              }}
              onBlur={() => {
                setTouched((previous) => ({ ...previous, password: true }));
                setFieldErrors((previous) => ({
                  ...previous,
                  password: password ? "" : requiredMessage,
                }));
              }}
              error={touched.password ? fieldErrors.password : ""}
              autoComplete="current-password"
              enterKeyHint="go"
              disabled={loading}
              required
            />

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={openForgotPassword}
                className="rounded text-sm font-semibold text-red-600 transition hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                {t("forgotPassword")}
              </button>
            </div>
          </div>

          <AuthSubmitButton
            loading={loading}
            label={t("login")}
            loadingLabel={t("loggingIn")}
            className="mt-1"
          />

          <hr className="border-gray-200" />

          {registrationEnabled ? (
            <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm text-gray-500">
              <span>{t("authNewHere")}</span>
              {popUp ? (
                <button
                  type="button"
                  className="rounded font-semibold text-red-600 transition hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  onClick={() => {
                    setShowSignUp?.(true);
                    setShowSignIn?.(false);
                  }}
                >
                  {t("createNewAccount")}
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="font-semibold text-red-600 transition hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  {t("createNewAccount")}
                </Link>
              )}
            </div>
          ) : null}
        </form>
      ) : (
        <form
          id="form_email"
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSendForgotPasswordEmail}
          noValidate
          aria-busy={loading || undefined}
        >
          {forgotSuccess ? (
            <FormAlert tone="success">{forgotSuccess}</FormAlert>
          ) : null}
          {generalError ? <FormAlert>{generalError}</FormAlert> : null}

          <AuthTextField
            id="signin-forgot-email"
            inputRef={forgotEmailRef}
            label={t("email")}
            placeholder={t("email")}
            type="email"
            value={forgotEmail}
            onChange={(event) => {
              setForgotEmail(event.target.value);
              setGeneralError("");
              setForgotSuccess("");
              if (touched.email) {
                setFieldErrors((previous) => ({
                  ...previous,
                  email: validateForgotEmail(event.target.value),
                }));
              }
            }}
            onBlur={() => {
              setTouched((previous) => ({ ...previous, email: true }));
              setFieldErrors((previous) => ({
                ...previous,
                email: validateForgotEmail(),
              }));
            }}
            error={touched.email ? fieldErrors.email : ""}
            icon={<MdEmail />}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="send"
            disabled={loading}
            required
          />

          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AuthSubmitButton
              loading={loading}
              label={t("send")}
              loadingLabel={t("sending")}
            />
            <button
              type="button"
              onClick={closeForgotPassword}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-red-600 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("cancel")}
            </button>
          </div>

          {forgotSuccess ? (
            <button
              type="button"
              onClick={closeForgotPassword}
              className="mx-auto rounded text-sm font-semibold text-red-600 transition hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              {t("backToSignIn") || "Back to sign in"}
            </button>
          ) : null}
        </form>
      )}

      <span className="sr-only" aria-live="polite">
        {loading ? t("loading") : ""}
      </span>
    </div>
  );

  if (popUp) {
    return <div className="p-6 sm:p-8">{content}</div>;
  }

  return <AuthLayout>{content}</AuthLayout>;
}
