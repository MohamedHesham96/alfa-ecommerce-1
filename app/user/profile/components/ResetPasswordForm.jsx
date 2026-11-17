"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "../../../../context/LanguageContext";
import { putRequest } from "../../../../utils/requestsUtils";
import { reportApiFailure } from "../../../../utils/connectivityStore";

import AuthHeading from "../../../../app/components/auth/AuthHeading";
import { AuthInput } from "../../../../app/components/auth/AuthField";
import AuthModal from "../../../../app/components/auth/AuthModal";
import AuthSubmitButton from "../../../../app/components/auth/AuthSubmitButton";
import FormAlert from "../../../../app/components/auth/FormAlert";
import PasswordRequirements from "../../../../app/components/auth/PasswordRequirements";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  extractAuthErrors,
  getPasswordByteLength,
  isBlank,
  pickAuthFieldErrors,
} from "../../../../app/components/auth/authValidation";

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

const FORM_FIELDS = ["oldPassword", "newPassword", "confirmPassword"];

export default function ResetPasswordForm({ isFormOpen, setIsFormOpen }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const requiredMessage =
    t("authFieldRequired") || "This field is required.";

  const resetState = () => {
    setOldPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setTouched({});
    setFieldErrors({});
    setGeneralError("");
    setLoading(false);
  };

  useEffect(() => {
    if (!isFormOpen) resetState();
  }, [isFormOpen]);

  const closeForm = () => {
    resetState();
    setIsFormOpen(false);
  };

  const validateOldPassword = (value = oldPassword) =>
    isBlank(value) ? requiredMessage : "";

  const validateNewPassword = (value = newPassword) => {
    if (isBlank(value)) return requiredMessage;
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
    if (oldPassword && value === oldPassword) {
      return (
        t("authPasswordSameAsOld") ||
        "New password must be different from the old password."
      );
    }
    return "";
  };

  const validateRepeatPassword = (value = repeatPassword) => {
    if (isBlank(value)) return requiredMessage;
    return value === newPassword
      ? ""
      : t("passwordMismatch") || "Passwords do not match.";
  };

  const applyBackendError = (error) => {
    const extracted = extractAuthErrors(error, t);
    const { fieldErrors: mapped, fallbackGeneral } = pickAuthFieldErrors(
      extracted.fieldErrors,
      FORM_FIELDS,
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

      const firstField = Object.keys(mapped)[0];
      if (firstField === "oldPassword") oldPasswordRef.current?.focus();
      if (firstField === "newPassword") newPasswordRef.current?.focus();
      if (firstField === "confirmPassword") {
        confirmPasswordRef.current?.focus();
      }
    }

    const general = extracted.generalError || fallbackGeneral;
    if (general) setGeneralError(general);
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (loading) return;

    setGeneralError("");

    const nextErrors = {
      oldPassword: validateOldPassword(),
      newPassword: validateNewPassword(),
      confirmPassword: validateRepeatPassword(),
    };

    setTouched({
      oldPassword: true,
      newPassword: true,
      confirmPassword: true,
    });
    setFieldErrors(nextErrors);

    if (nextErrors.oldPassword) {
      oldPasswordRef.current?.focus();
      return;
    }
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
      const result = await putRequest(
        "/api/users/reset-password",
        {
          oldPassword,
          newPassword,
          repeatPassword,
        },
        "",
        { suppressErrorToast: true },
      );

      // putRequest returns null when the user cancels a confirmation dialog.
      if (result === null) {
        return;
      }

      closeForm();
      AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      router.push("/signin");
    } catch (error) {
      reportApiFailure(error);
      applyBackendError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModal
      open={Boolean(isFormOpen)}
      onClose={closeForm}
      labelledBy="reset-password-title"
      maxWidth="max-w-[500px]"
    >
      <form
        onSubmit={resetPassword}
        noValidate
        aria-busy={loading || undefined}
        className="flex w-full flex-col gap-4 px-6 pb-7 pt-8 sm:px-8"
      >
        <AuthHeading
          id="reset-password-title"
          title={t("updatePassword")}
          description={t("authChangePasswordDescription")}
          showLanguageToggle={false}
          className="pe-10"
        />

        {generalError ? (
          <FormAlert className="mt-1">{generalError}</FormAlert>
        ) : null}

        <AuthInput
          id="reset-old-password"
          inputRef={oldPasswordRef}
          label={t("oldPassword")}
          type="password"
          value={oldPassword}
          autoComplete="current-password"
          onChange={(event) => {
            setOldPassword(event.target.value);
            setGeneralError("");
            if (touched.oldPassword) {
              setFieldErrors((previous) => ({
                ...previous,
                oldPassword: event.target.value
                  ? ""
                  : requiredMessage,
              }));
            }
          }}
          onBlur={() => {
            setTouched((previous) => ({
              ...previous,
              oldPassword: true,
            }));
            setFieldErrors((previous) => ({
              ...previous,
              oldPassword: validateOldPassword(),
            }));
          }}
          error={touched.oldPassword ? fieldErrors.oldPassword : ""}
          enterKeyHint="next"
          disabled={loading}
          data-autofocus
          required
        />

        <AuthInput
          id="reset-new-password"
          inputRef={newPasswordRef}
          label={t("newPassword")}
          type="password"
          value={newPassword}
          autoComplete="new-password"
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
                  event.target.value === repeatPassword
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
          error={touched.newPassword ? fieldErrors.newPassword : ""}
          enterKeyHint="next"
          disabled={loading}
          required
        />

        <AuthInput
          id="reset-confirm-password"
          inputRef={confirmPasswordRef}
          label={t("confirmPassword")}
          type="password"
          value={repeatPassword}
          autoComplete="new-password"
          onChange={(event) => {
            setRepeatPassword(event.target.value);
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
              confirmPassword: validateRepeatPassword(),
            }));
          }}
          error={
            touched.confirmPassword ? fieldErrors.confirmPassword : ""
          }
          enterKeyHint="done"
          disabled={loading}
          required
        />

        <PasswordRequirements
          password={newPassword}
          confirmPassword={repeatPassword}
        />

        <AuthSubmitButton
          loading={loading}
          label={t("save")}
          loadingLabel={t("saving") || "Saving..."}
          className="mt-2"
        />
      </form>
    </AuthModal>
  );
}
