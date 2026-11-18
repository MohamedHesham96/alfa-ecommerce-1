"use client";

/**
 * Shared validation helpers for every authentication form.
 *
 * The rules below mirror the existing backend contracts. They exist to give
 * users faster feedback; the API remains the final authority.
 */
export const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const AUTH_USERNAME_PATTERN =
  /^[a-zA-Z][a-zA-Z0-9._-]{1,28}[a-zA-Z0-9]$/;
export const AUTH_PHONE_PATTERN = /^01[0125][0-9]{8}$/;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 72;
export const AUTH_PASSWORD_MAX_BYTES = 72;

const FIELD_ALIASES = {
  repeatpassword: "confirmPassword",
  confirmpassword: "confirmPassword",
  newpassword: "newPassword",
  oldpassword: "oldPassword",
  phone: "phoneNumber",
  phonenumber: "phoneNumber",
  governorateid: "governorate",
  governorate: "governorate",
  firstname: "firstName",
  lastname: "lastName",
  username: "username",
  email: "email",
  address: "address",
  password: "password",
  token: "token",
};

const UNSAFE_MESSAGE_PATTERNS = [
  /\b(?:java|javax|jakarta|org|com)\.[a-z0-9_.$]+/i,
  /\bat\s+[a-z0-9_.$]+\([^)]*\)/i,
  /SQLException|PSQLException|DataIntegrityViolation|NullPointerException/i,
  /stack\s*trace|duplicate\s+key\s+value\s+violates|syntax\s+error\s+at\s+or\s+near/i,
  /violates\s+(?:unique|foreign\s+key|not-null)\s+constraint/i,
];

export function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

export function isTechnicalMessage(message) {
  if (typeof message !== "string") return true;

  const value = message.trim();
  if (!value || value.length > 600) return true;

  return UNSAFE_MESSAGE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Normalizes API field names (for example `repeatPassword`, `phone`,
 * `userDTO.email`, `governorateId`) to the field names used by the forms.
 */
export function normalizeAuthFieldName(fieldName) {
  if (typeof fieldName !== "string") return "";

  const lastSegment = fieldName.split(".").pop() || "";
  const key = lastSegment.replace(/[\s_-]/g, "").toLowerCase();

  return FIELD_ALIASES[key] || key;
}

/**
 * Returns the byte length used by the backend BCrypt guard. `TextEncoder` is
 * available in every supported browser; the fallback keeps older runtimes
 * working without ever throwing.
 */
export function getPasswordByteLength(password) {
  if (!password) return 0;

  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(password).length;
  }

  try {
    return unescape(encodeURIComponent(password)).length;
  } catch {
    return password.length;
  }
}

function readSafeMessage(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = readSafeMessage(item);
      if (message) return message;
    }
    return "";
  }

  if (value && typeof value === "object") {
    return readSafeMessage(value.message || value.msg || "");
  }

  if (typeof value !== "string") return "";

  const message = value.trim();
  if (!message || isTechnicalMessage(message)) return "";

  return message;
}

function getErrorPayload(error) {
  const responseData = error?.response?.data;

  if (!responseData || typeof responseData !== "object") return null;

  if (responseData.error && typeof responseData.error === "object") {
    return responseData.error;
  }

  return responseData;
}

/**
 * Extracts field-level and form-level messages from the actual API error
 * envelopes (`error.details`, `details`, or a direct field map) and produces a
 * localized fallback for network, rate-limit and server failures.
 *
 * The returned field map is not filtered: callers merge only the fields their
 * form owns and promote the rest to the form-level alert.
 */
export function extractAuthErrors(error, t) {
  const fieldErrors = {};
  const status = error?.response?.status;
  const payload = error?.response?.data;
  const apiError = getErrorPayload(error);

  let details = apiError?.details;

  if (!details && payload && typeof payload === "object") {
    details = payload.details;
  }

  if (!details && payload && typeof payload === "object" && !payload.success) {
    const reserved = new Set([
      "success",
      "error",
      "message",
      "status",
      "code",
      "timestamp",
      "path",
    ]);

    const directFields = Object.entries(payload).filter(
      ([key, value]) =>
        !reserved.has(key) &&
        (typeof value === "string" ||
          (value && typeof value === "object" && value.message)),
    );

    if (directFields.length > 0) {
      details = Object.fromEntries(directFields);
    }
  }

  if (details && typeof details === "object") {
    Object.entries(details).forEach(([field, message]) => {
      const fieldName = normalizeAuthFieldName(field);
      const text = readSafeMessage(message);

      if (fieldName && text && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = text;
      }
    });
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  let generalError = "";

  if (!error?.response) {
    generalError =
      t("authNetworkError") ||
      "We could not reach the server. Check your connection and try again.";
  } else if (status === 429) {
    generalError =
      t("authTooManyRequests") ||
      "Too many attempts. Please wait a moment and try again.";
  } else if (typeof status === "number" && status >= 500) {
    generalError =
      t("authServerError") ||
      "Something went wrong on our side. Please try again later.";
  } else if (!hasFieldErrors) {
    generalError =
      readSafeMessage(apiError?.message) ||
      readSafeMessage(payload?.message) ||
      t("somethingWentWrong") ||
      "Something went wrong. Please try again.";
  }

  return { fieldErrors, generalError, status };
}

/**
 * Copies only the fields the form knows about, reporting the first unknown
 * message so it is never silently dropped.
 */
export function pickAuthFieldErrors(fieldErrors, knownFields) {
  const known = new Set(knownFields);
  const picked = {};
  let fallbackGeneral = "";

  Object.entries(fieldErrors || {}).forEach(([field, message]) => {
    if (known.has(field)) {
      if (!picked[field]) picked[field] = message;
    } else if (!fallbackGeneral) {
      fallbackGeneral = message;
    }
  });

  return { fieldErrors: picked, fallbackGeneral };
}
