"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MdLanguage } from "react-icons/md";
import { useLanguage } from "../../context/LanguageContext";
import { postRequest, putRequest } from "../../utils/requestsUtils";

export default function ForgotPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { locale, setLocale, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requestReset = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await postRequest("/api/auth/forgot-password", { email }, "", true);
      setSuccess(
        t("forgotPasswordEmailSent") ||
          "If an account with that email exists, a reset link has been sent.",
      );
      setEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          t("somethingWentWrong") ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(t("invalidResetLink") || "The reset link is invalid or missing.");
      return;
    }
    if (newPassword.length < 8) {
      setError(
        t("passwordTooShort") ||
          "Password must be at least 8 characters long.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch") || "Passwords do not match.");
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
      );
      setSuccess(
        t("resetSuccess") ||
          "Password updated successfully. You can now sign in.",
      );
      setNewPassword("");
      setConfirmPassword("");
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/forgotpassword");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          t("somethingWentWrong") ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full p-10 md:order-1 xs:order-2">
      <div className="flex justify-between">
        <div>
          <h3 className="text-3xl my-3 font-semibold font-serif">
            {token
              ? t("resetPasswordTitle") || "Reset your password"
              : t("forgotPassword") || "Forgot password"}
          </h3>
        </div>
        <div className="flex items-center gap-1 mx-5">
          <span className="text-red-600 text-2xl">
            <MdLanguage />
          </span>
          <select
            aria-label={t("language")}
            className="w-[80px] rounded text-white bg-red-700 py-1 px-1"
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
          >
            <option value="ar" className="bg-white text-red-500">
              العربية
            </option>
            <option value="en" className="bg-white text-red-500">
              English
            </option>
          </select>
        </div>
      </div>

      <div className="flex justify-center items-center mt-20">
        <div className="flex flex-col gap-7 w-[80%]">
          {success ? (
            <div role="status" className="rounded-md bg-green-50 p-5 text-green-800">
              <p>{success}</p>
              <Link href="/signin" className="mt-3 inline-block font-semibold text-red-600">
                {t("backToSignIn") || "Back to sign in"}
              </Link>
            </div>
          ) : token ? (
            <form className="flex flex-col gap-6" onSubmit={resetPassword}>
              <div className="w-full px-2 rounded-md h-10 border items-center">
                <input
                  aria-label={t("newPassword") || "New password"}
                  className="w-full h-full px-3 outline-none"
                  placeholder={t("newPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
              <div className="w-full px-2 rounded-md h-10 border items-center gap-3">
                <input
                  aria-label={t("confirmPassword") || "Confirm password"}
                  className="w-full h-full px-3 outline-none"
                  placeholder={t("confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white rounded-md w-full h-10 my-10 hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? t("sending") || "Saving..." : t("save") || "Save"}
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-6" onSubmit={requestReset}>
              <div className="w-full px-2 rounded-md h-10 border items-center">
                <input
                  aria-label={t("email") || "Email"}
                  className="w-full h-full px-3 outline-none"
                  placeholder={t("email")}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white rounded-md w-full h-10 my-10 hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? t("sending") || "Sending..." : t("send") || "Send"}
              </button>
            </form>
          )}

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {!token && !success ? (
            <Link href="/signin" className="text-sm text-gray-500">
              {t("backToSignIn") || "Back to sign in"}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
