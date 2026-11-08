"use client";

import { FaTimesCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "../../../../context/LanguageContext";
import { putRequest } from "../../../../utils/requestsUtils";

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

export default function ResetPasswordForm({ isFormOpen, setIsFormOpen }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closeForm = () => {
    setIsFormOpen(false);
    setOldPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setError("");
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(
        t("passwordTooShort") ||
          "Password must be at least 8 characters long.",
      );
      return;
    }
    if (newPassword !== repeatPassword) {
      setError(t("passwordMismatch") || "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await putRequest(
        "/api/users/reset-password",
        {
          oldPassword,
          newPassword,
          repeatPassword,
        },
        "",
      );

      // putRequest returns null when the user cancels a confirmation dialog.
      if (result === null) {
        return;
      }

      closeForm();
      AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      router.push("/signin");
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
    <div
      id="reset-password-modal"
      className={`fixed inset-0 bg-black/40 flex items-center justify-end z-50 p-5 ${
        isFormOpen ? "flex" : "hidden"
      }`}
    >
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Image
            src="/Images/logo.png"
            alt=""
            className="w-[100px] h-[100px] border-t-transparent rounded-full animate-pulse"
            width={100}
            height={100}
            priority
          />
        </div>
      )}
      <div className="w-full flex justify-center items-center">
        <form
          onSubmit={resetPassword}
          autoComplete="off"
          className="w-full max-w-[500px] py-10 flex flex-col justify-center items-center
         gap-3 my-5 bg-white shadow-md shadow-slate-400 rounded-lg
           px-7 pb-10 border max-h-[90vh] overflow-y-auto h-auto"
        >
          <div className="w-full flex justify-between items-center">
            <h1 className="text-lg w-full font-semibold">
              {t("updatePassword")}
            </h1>
            <button
              type="button"
              aria-label="Close"
              onClick={closeForm}
              className="text-xl text-gray-600 hover:text-red-600"
            >
              <FaTimesCircle />
            </button>
          </div>
          <hr className="bg-gray-200 w-full h-px" />
          <div className="flex flex-col w-full">
            <label htmlFor="old-password" className="text-xs font-semibold">
              {t("oldPassword")}
            </label>
            <div className="flex w-full px-2 rounded-md mt-2 bg-white border h-10 items-center gap-3">
              <input
                id="old-password"
                type="password"
                className="w-full h-full bg-none outline-none p-2"
                value={oldPassword}
                autoComplete="current-password"
                onChange={(event) => setOldPassword(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col w-full">
            <label htmlFor="new-password" className="text-xs font-semibold">
              {t("newPassword")}
            </label>
            <div className="flex w-full px-2 rounded-md mt-2 bg-white border h-10 items-center gap-3">
              <input
                id="new-password"
                type="password"
                className="w-full h-full bg-none outline-none p-2"
                value={newPassword}
                autoComplete="new-password"
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
          <div className="flex flex-col w-full">
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold"
            >
              {t("confirmPassword")}{" "}
            </label>
            <div className="flex w-full px-2 rounded-md mt-2 bg-white border h-10 items-center gap-3">
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="w-full h-full bg-none outline-none p-2"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
          {error ? (
            <p role="alert" className="w-full text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 p-2 rounded-md mt-5 text-white disabled:opacity-60"
          >
            {t("save")}
          </button>
        </form>
      </div>
    </div>
  );
}
