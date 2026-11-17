"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdEmail } from "react-icons/md";
import {
  FaLocationDot,
  FaPhone,
  FaUserLarge,
  FaUserPlus,
} from "react-icons/fa6";
import { toast } from "react-toastify";

import { useLanguage } from "../../context/LanguageContext";
import { useFeature } from "../../context/AppConfigContext";
import { resolveLanguage } from "../../utils/languageUtils";
import { clearUserScopedCaches } from "../../lib/pwa/client";
import { reportApiFailure } from "../../utils/connectivityStore";

import AuthHeading from "./auth/AuthHeading";
import { AuthInput } from "./auth/AuthField";
import AuthSelect from "./auth/AuthSelect";
import AuthLayout from "./auth/AuthLayout";
import AuthSubmitButton from "./auth/AuthSubmitButton";
import FormAlert from "./auth/FormAlert";
import PasswordRequirements from "./auth/PasswordRequirements";
import {
  AUTH_EMAIL_PATTERN,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PHONE_PATTERN,
  AUTH_USERNAME_PATTERN,
  extractAuthErrors,
  getPasswordByteLength,
  isBlank,
  pickAuthFieldErrors,
} from "./auth/authValidation";

const INITIAL_VALUES = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  phoneNumber: "",
  address: "",
  password: "",
  confirmPassword: "",
};

const FIELD_ORDER = [
  "firstName",
  "lastName",
  "email",
  "username",
  "phoneNumber",
  "governorate",
  "address",
  "password",
  "confirmPassword",
];

export default function SignUp({
  popUp,
  setShowSignIn,
  setShowSignUp,
  setOpenForm,
}) {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const registrationEnabled = useFeature(
    "features.customerRegistration.enabled",
  );

  const [values, setValues] = useState(INITIAL_VALUES);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [governorates, setGovernorates] = useState([]);
  const [governorateLoadFailed, setGovernorateLoadFailed] = useState(false);
  const [governorateLoading, setGovernorateLoading] = useState(true);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const phoneRef = useRef(null);
  const governorateRef = useRef(null);
  const addressRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const requiredMessage =
    t("authFieldRequired") || "This field is required.";

  const getGovernorate = useCallback(async () => {
    setGovernorateLoading(true);
    setGovernorateLoadFailed(false);

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/governorates`,
      );
      const rows = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setGovernorates(
        rows.map((item) => ({
          value: item.governorateId,
          label: locale === "ar" ? item.nameAr : item.nameEn,
        })),
      );
    } catch {
      setGovernorateLoadFailed(true);
    } finally {
      setGovernorateLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    getGovernorate();
  }, [getGovernorate]);

  useEffect(() => {
    if (!selectedGovernorate) return;

    const refreshed = governorates.find(
      (option) => option.value === selectedGovernorate.value,
    );
    if (refreshed && refreshed.label !== selectedGovernorate.label) {
      setSelectedGovernorate(refreshed);
    }
  }, [governorates, selectedGovernorate]);

  const validateField = (name, value, allValues = values) => {
    switch (name) {
      case "firstName":
      case "lastName":
      case "address":
        return isBlank(value) ? requiredMessage : "";
      case "email":
        if (isBlank(value)) return requiredMessage;
        return AUTH_EMAIL_PATTERN.test(value.trim())
          ? ""
          : t("authInvalidEmail") || "Enter a valid email address.";
      case "username":
        if (isBlank(value)) return requiredMessage;
        return AUTH_USERNAME_PATTERN.test(value.trim())
          ? ""
          : t("authUsernameInvalid") ||
              "Use 3 to 30 letters, numbers, dots, underscores or hyphens.";
      case "phoneNumber":
        if (isBlank(value)) return requiredMessage;
        return AUTH_PHONE_PATTERN.test(value)
          ? ""
          : t("authPhoneInvalid") ||
              "Enter a valid Egyptian mobile number.";
      case "password":
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
      case "confirmPassword":
        if (!value) return requiredMessage;
        return value === allValues.password
          ? ""
          : t("passwordMismatch") || "Passwords do not match.";
      default:
        return "";
    }
  };

  const focusField = (name) => {
    const refs = {
      firstName: firstNameRef,
      lastName: lastNameRef,
      email: emailRef,
      username: usernameRef,
      phoneNumber: phoneRef,
      governorate: governorateRef,
      address: addressRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef,
    };

    refs[name]?.current?.focus?.();
  };

  const validateAll = () => {
    const nextErrors = {};

    Object.keys(INITIAL_VALUES).forEach((name) => {
      nextErrors[name] = validateField(name, values[name], values);
    });

    nextErrors.governorate = selectedGovernorate ? "" : requiredMessage;

    setFieldErrors(nextErrors);
    setTouched(
      FIELD_ORDER.reduce((next, name) => {
        next[name] = true;
        return next;
      }, {}),
    );

    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return false;
    }

    return true;
  };

  const updateField = (name, value) => {
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    setGeneralError("");

    if (touched[name]) {
      setFieldErrors((previous) => ({
        ...previous,
        [name]: validateField(name, value, nextValues),
      }));
    }

    if (name === "password" && touched.confirmPassword) {
      setFieldErrors((previous) => ({
        ...previous,
        confirmPassword: validateField(
          "confirmPassword",
          nextValues.confirmPassword,
          nextValues,
        ),
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched((previous) => ({ ...previous, [name]: true }));
    setFieldErrors((previous) => ({
      ...previous,
      [name]: validateField(name, values[name], values),
    }));
  };

  const applyBackendError = (error) => {
    const extracted = extractAuthErrors(error, t);
    const { fieldErrors: mapped, fallbackGeneral } = pickAuthFieldErrors(
      extracted.fieldErrors,
      FIELD_ORDER,
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
      focusField(Object.keys(mapped)[0]);
    }

    const general = extracted.generalError || fallbackGeneral;
    if (general) setGeneralError(general);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (loading) return;

    setGeneralError("");
    if (!validateAll()) return;

    setLoading(true);

    const payload = {
      username: values.username,
      password: values.password,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      repeatPassword: values.confirmPassword,
      address: values.address,
      phone: values.phoneNumber,
      language: locale,
      governorateId: selectedGovernorate?.value ?? null,
    };

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/signup`,
        payload,
        {},
      );

      if (popUp) {
        if (response.data.success) {
          const loginResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
            {
              username: values.username,
              password: values.password,
            },
            {},
          );

          localStorage.setItem("accessToken", loginResponse.data.accessToken);
          localStorage.setItem("refreshToken", loginResponse.data.refreshToken);
          localStorage.setItem("id", loginResponse.data.userDetails.userId);
          localStorage.setItem(
            "firstName",
            loginResponse.data.userDetails.firstName,
          );
          localStorage.setItem(
            "lastName",
            loginResponse.data.userDetails.lastName,
          );
          localStorage.setItem(
            "address",
            loginResponse.data.userDetails.address,
          );
          localStorage.setItem("phone", loginResponse.data.userDetails.phone);
          localStorage.setItem("email", loginResponse.data.userDetails.email);
          localStorage.setItem(
            "username",
            loginResponse.data.userDetails.username,
          );

          const language = resolveLanguage(
            loginResponse.data.userDetails.language,
          );
          localStorage.setItem("lang", language);
          setLocale(language);
          localStorage.setItem("role", loginResponse.data.userDetails.role);
          localStorage.setItem(
            "systemSettingsAccess",
            String(
              loginResponse.data.userDetails.systemSettingsAccess === true,
            ),
          );

          const governorateId =
            loginResponse.data.userDetails.governorate?.governorateId;
          if (governorateId !== undefined && governorateId !== null) {
            localStorage.setItem("governorateId", governorateId);
          } else {
            localStorage.removeItem("governorateId");
          }

          await clearUserScopedCaches().catch(() => {});

          router.refresh();
          setOpenForm?.(false);
        }
      } else {
        if (response.data?.message) toast.success(response.data.message);
        router.push("/signin");
      }
    } catch (error) {
      reportApiFailure(error);
      applyBackendError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!registrationEnabled) {
    const unavailable = (
      <div className="flex min-h-[280px] w-full flex-col items-center justify-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <FaUserPlus className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2
          id="auth-signup-title"
          className="mt-4 text-xl font-bold text-gray-900"
        >
          {t("registration_unavailable_title")}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
          {t("registration_unavailable_description")}
        </p>

        {popUp ? (
          <button
            type="button"
            onClick={() => {
              setShowSignIn?.(true);
              setShowSignUp?.(false);
            }}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            {t("login")}
          </button>
        ) : (
          <Link
            href="/signin"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            {t("login")}
          </Link>
        )}
      </div>
    );

    return popUp ? (
      <div className="p-6 sm:p-8">{unavailable}</div>
    ) : (
      <AuthLayout>{unavailable}</AuthLayout>
    );
  }

  const SectionHeading = popUp ? "h3" : "h2";

  const content = (
    <div className="w-full">
      <AuthHeading
        id="auth-signup-title"
        as={popUp ? "h2" : "h1"}
        title={t("create_account")}
        description={t("signupWelcomeMessage")}
        className={popUp ? "pe-10" : ""}
      />

      <form
        className="mt-6 space-y-6"
        onSubmit={handleSignUp}
        noValidate
        aria-busy={loading || undefined}
      >
        {generalError ? <FormAlert>{generalError}</FormAlert> : null}

        <section className="space-y-4">
          <SectionHeading className="text-sm font-bold text-gray-900">
            {t("authSectionAccount")}
          </SectionHeading>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthInput
              id="signup-first-name"
              inputRef={firstNameRef}
              label={t("firstName")}
              value={values.firstName}
              onChange={(event) =>
                updateField("firstName", event.target.value)
              }
              onBlur={() => handleBlur("firstName")}
              error={touched.firstName ? fieldErrors.firstName : ""}
              icon={<FaUserLarge />}
              autoComplete="given-name"
              enterKeyHint="next"
              disabled={loading}
              data-autofocus
              required
            />

            <AuthInput
              id="signup-last-name"
              inputRef={lastNameRef}
              label={t("lastName")}
              value={values.lastName}
              onChange={(event) =>
                updateField("lastName", event.target.value)
              }
              onBlur={() => handleBlur("lastName")}
              error={touched.lastName ? fieldErrors.lastName : ""}
              icon={<FaUserLarge />}
              autoComplete="family-name"
              enterKeyHint="next"
              disabled={loading}
              required
            />
          </div>

          <AuthInput
            id="signup-email"
            inputRef={emailRef}
            label={t("email")}
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            onBlur={() => handleBlur("email")}
            error={touched.email ? fieldErrors.email : ""}
            icon={<MdEmail />}
            placeholder="name@example.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            disabled={loading}
            required
          />

          <AuthInput
            id="signup-username"
            inputRef={usernameRef}
            label={t("username")}
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            onBlur={() => handleBlur("username")}
            error={touched.username ? fieldErrors.username : ""}
            hint={t("authUsernameHint")}
            icon={<FaUserLarge />}
            placeholder="ahmed_ali"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            disabled={loading}
            required
          />
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-6">
          <SectionHeading className="text-sm font-bold text-gray-900">
            {t("authSectionContact")}
          </SectionHeading>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthInput
              id="signup-phone"
              inputRef={phoneRef}
              label={t("phoneNumber")}
              type="tel"
              value={values.phoneNumber}
              onChange={(event) =>
                updateField(
                  "phoneNumber",
                  event.target.value.replace(/\D/g, "").slice(0, 11),
                )
              }
              onBlur={() => handleBlur("phoneNumber")}
              error={touched.phoneNumber ? fieldErrors.phoneNumber : ""}
              icon={<FaPhone />}
              placeholder="01XXXXXXXXX"
              autoComplete="tel-national"
              inputMode="tel"
              enterKeyHint="next"
              disabled={loading}
              required
            />

            <div>
              <AuthSelect
                id="signup-governorate"
                selectRef={governorateRef}
                label={t("governorate")}
                options={governorates}
                value={selectedGovernorate}
                onChange={(option) => {
                  setSelectedGovernorate(option);
                  setGeneralError("");
                  if (touched.governorate) {
                    setFieldErrors((previous) => ({
                      ...previous,
                      governorate: option ? "" : requiredMessage,
                    }));
                  }
                }}
                onBlur={() => {
                  setTouched((previous) => ({
                    ...previous,
                    governorate: true,
                  }));
                  setFieldErrors((previous) => ({
                    ...previous,
                    governorate: selectedGovernorate
                      ? ""
                      : requiredMessage,
                  }));
                }}
                error={
                  touched.governorate ? fieldErrors.governorate : ""
                }
                isSearchable={false}
                isLoading={governorateLoading}
                isDisabled={loading || governorateLoadFailed}
                placeholder={t("selectGovernorate")}
                loadingMessage={() => t("loading")}
                noOptionsMessage={() => t("no_data")}
                required
              />

              {governorateLoadFailed ? (
                <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-red-600">
                  <span>{t("authGovernoratesLoadError")}</span>
                  <button
                    type="button"
                    onClick={getGovernorate}
                    className="rounded font-semibold underline underline-offset-2 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                  >
                    {t("retry")}
                  </button>
                </p>
              ) : null}
            </div>
          </div>

          <AuthInput
            id="signup-address"
            inputRef={addressRef}
            label={t("address")}
            value={values.address}
            onChange={(event) => updateField("address", event.target.value)}
            onBlur={() => handleBlur("address")}
            error={touched.address ? fieldErrors.address : ""}
            icon={<FaLocationDot />}
            placeholder={t("authAddressPlaceholder")}
            autoComplete="street-address"
            enterKeyHint="next"
            disabled={loading}
            required
          />
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-6">
          <SectionHeading className="text-sm font-bold text-gray-900">
            {t("authSectionSecurity")}
          </SectionHeading>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthInput
              id="signup-password"
              inputRef={passwordRef}
              label={t("password")}
              type="password"
              value={values.password}
              onChange={(event) =>
                updateField("password", event.target.value)
              }
              onBlur={() => handleBlur("password")}
              error={touched.password ? fieldErrors.password : ""}
              autoComplete="new-password"
              enterKeyHint="next"
              disabled={loading}
              required
            />

            <AuthInput
              id="signup-confirm-password"
              inputRef={confirmPasswordRef}
              label={t("confirmPassword")}
              type="password"
              value={values.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              onBlur={() => handleBlur("confirmPassword")}
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
          </div>

          <PasswordRequirements
            password={values.password}
            confirmPassword={values.confirmPassword}
          />
        </section>

        <AuthSubmitButton
          loading={loading}
          label={t("create_account")}
          loadingLabel={t("creating_account")}
          disabled={governorateLoading}
        />
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm text-gray-500">
        <span>{t("authAlreadyHaveAccount")}</span>
        {popUp ? (
          <button
            type="button"
            onClick={() => {
              setShowSignIn?.(true);
              setShowSignUp?.(false);
            }}
            className="rounded font-semibold text-red-600 transition hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {t("login")}
          </button>
        ) : (
          <Link
            href="/signin"
            className="font-semibold text-red-600 transition hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {t("login")}
          </Link>
        )}
      </div>
    </div>
  );

  if (popUp) {
    return <div className="p-6 sm:p-8">{content}</div>;
  }

  return <AuthLayout>{content}</AuthLayout>;
}
