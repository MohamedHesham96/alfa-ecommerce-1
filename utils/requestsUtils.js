import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { reportApiFailure } from "./connectivityStore";
import {
  invalidateCatalogCaches,
} from "../lib/pwa/client";
import { clearAuthStorage } from "./authSession";

const showRequestError = (error) => {
  const responseData = error?.response?.data;

  // Try to collect all validation messages
  const messagesSet = new Set();
  
  // Check various possible error structures
  // 1. response.data.error.details (object with field -> message)
  if (responseData?.error?.details) {
    const details = responseData.error.details;
    if (typeof details === "object" && !Array.isArray(details)) {
      Object.values(details).forEach((msg) => {
        if (msg && typeof msg === "string") {
          messagesSet.add(msg);
        } else if (msg && typeof msg === "object") {
          // In case nested objects
          Object.values(msg).forEach((m) => {
            if (typeof m === "string") messagesSet.add(m);
          });
        }
      });
    } else if (Array.isArray(details)) {
      details.forEach((item) => {
        if (typeof item === "string") {
          messagesSet.add(item);
        } else if (item?.message) {
          messagesSet.add(item.message);
        } else if (item?.msg) {
          messagesSet.add(item.msg);
        }
      });
    }
  }
  
  // 2. response.data.details
  if (responseData?.details) {
    const details = responseData.details;
    if (typeof details === "object" && !Array.isArray(details)) {
      Object.values(details).forEach((msg) => {
        if (msg && typeof msg === "string") {
          messagesSet.add(msg);
        }
      });
    } else if (Array.isArray(details)) {
      details.forEach((item) => {
        if (typeof item === "string") {
          messagesSet.add(item);
        } else if (item?.message) {
          messagesSet.add(item.message);
        }
      });
    }
  }
  
  // 3. response.data itself might be validation errors object
  if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
    // Check if it's directly field errors (not wrapped)
    if (responseData.error && typeof responseData.error === "object" && !responseData.error.message && responseData.error.details) {
      // Already handled above
    } else if (!responseData.error && !responseData.message && !responseData.data) {
      // Might be direct field errors
      const keys = Object.keys(responseData);
      // If keys look like field names and values are strings, treat as errors
      const hasFieldErrors = keys.some(k => typeof responseData[k] === "string" && !["status", "success", "code"].includes(k));
      if (hasFieldErrors && keys.length > 0) {
        keys.forEach((key) => {
          if (typeof responseData[key] === "string" && !["status", "success", "code", "timestamp"].includes(key)) {
            messagesSet.add(responseData[key]);
          }
        });
      }
    }
  }
  
  // 4. Also check error.response.data.error.message as fallback
  if (messagesSet.size === 0) {
    const message = responseData?.error?.message || responseData?.message || error?.message;
    if (message && typeof message === "string") {
      messagesSet.add(message);
    }
  }
  
  // Display all messages as separate toasts
  if (messagesSet.size > 0) {
    Array.from(messagesSet).forEach((msg) => {
      toast.error(msg);
    });
  } else {
    // Fallback
    toast.error(error?.message || "An error occurred");
  }
};

let refreshInFlight = null;

const isAuthFailure = (error) =>
  error?.response?.status === 401 || error?.response?.status === 403;

const isBrowserOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const throwOfflineMutationError = () => {
  const isArabic =
    typeof window !== "undefined" && localStorage.getItem("lang") === "ar";
  const message = isArabic
    ? "لا يوجد اتصال بالإنترنت. لم يتم حفظ هذا التغيير. حاول مرة أخرى بعد استعادة الاتصال."
    : "You are offline. This change was not saved. Try again when you are back online.";
  toast.error(message);
  const error = new Error(message);
  error.code = "ALFA_OFFLINE";
  error.isOffline = true;
  throw error;
};

const shouldInvalidateCatalog = (endpoint) =>
  typeof endpoint === "string" && endpoint.startsWith("/api/admin/");

const invalidateCatalogAfterAdminChange = (endpoint) => {
  if (!shouldInvalidateCatalog(endpoint)) return;
  invalidateCatalogCaches().catch(() => {});
};

const redirectToSignIn = () => {
  if (typeof window === "undefined") return;
  if (!window.location.pathname.startsWith("/signin")) {
    window.location.href = new URL("/signin", window.location.origin).toString();
  }
};

const getRefreshedAccessToken = async () => {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("refreshToken");
  // Do not call /api/auth/refresh when there is no token. This is the path
  // that produced the noisy 401 "refresh token missing" requests.
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      )
      .then((response) => {
        const accessToken = response.data?.accessToken;
        const newRefreshToken = response.data?.refreshToken;
        if (!accessToken || !newRefreshToken) {
          throw new Error("Invalid refresh response");
        }
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        return accessToken;
      })
      .catch((error) => {
        if (isAuthFailure(error)) {
          clearAuthStorage().finally(() => {
            redirectToSignIn();
          });
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  try {
    return await refreshInFlight;
  } catch {
    return null;
  }
};

export const logoutRequest = async () => {
  if (typeof window === "undefined") return;

  const postLogout = (accessToken) =>
    axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

  const accessToken = localStorage.getItem("accessToken");

  try {
    if (!accessToken) return;

    try {
      await postLogout(accessToken);
    } catch (error) {
      // If the access token already expired, refresh once before revoking so
      // the server still drops the user's active refresh tokens.
      if (isAuthFailure(error)) {
        const newAccessToken = await getRefreshedAccessToken();
        if (newAccessToken) {
          try {
            await postLogout(newAccessToken);
          } catch {
            // Local sign-out must still complete.
          }
        }
      }
      // Local sign-out must still complete if the session already expired.
    }
  } finally {
    // Never leave credentials, profile fields, pages, or API responses from
    // this account available on a shared device, even when the server is
    // unreachable.
    await clearAuthStorage();
  }
};

// const redirectToLogin = () => {
//   if (typeof window !== "undefined") {
//     window.location.href = "/signin";
//   }
// };

export const postRequest = async (endpoint, dataBody, message ,toster, options = {}) => {
  if (isBrowserOffline()) throwOfflineMutationError();

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("lang") : null;
  const request = async (token) => {


    return axios.post(
      process.env.NEXT_PUBLIC_API_BASE_URL + endpoint,
      dataBody,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Accept-Language": lang,
        },
        signal: options.signal,
      }
    )
  }


  try {
    // 🟢 بدون confirm
    if (message === "") {
      const token = getToken();

      const response = await request(token)
      if(toster) toast.success(response.data.message);
      invalidateCatalogAfterAdminChange(endpoint);

      return response.data;



    }

    // 🟡 مع confirm
    const result = await Swal.fire({
      icon: "question",
      title: message,
      showCancelButton: true,
      confirmButtonText: lang === "ar" ? "نعم" : "OK",
      cancelButtonText: lang === "ar" ? "إلغاء" : "Cancel",
      customClass: {
        popup: "rounded-xl shadow-lg border border-gray-200 p-6",
        title: "text-xl font-bold text-gray-800 mb-2",
        content: "text-sm text-gray-600 mb-4",
        confirmButton:
          "bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2 rounded-lg",
        cancelButton:
          "bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-lg ml-2",
      },
      reverseButtons: lang === "ar",
    });

    if (result.isConfirmed) {

      const token = getToken();

      const response = await request(token);
      toast.success(response.data.message);
      invalidateCatalogAfterAdminChange(endpoint);
      return response.data;

    }
  } catch (error) {
    if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
      throw error;
    }
    reportApiFailure(error);

    if (isAuthFailure(error)) {
      const newAccessToken = await getRefreshedAccessToken();
      if (newAccessToken) {
        try {
          const retryResponse = await request(newAccessToken);
          toast.success(retryResponse.data.message);
          invalidateCatalogAfterAdminChange(endpoint);
          return retryResponse.data;
        } catch (retryError) {
          if (axios.isCancel(retryError) || retryError?.code === "ERR_CANCELED") {
            throw retryError;
          }
          reportApiFailure(retryError);
          showRequestError(retryError);
        }
      }
    } else {
      showRequestError(error);
    }

    throw error;
  }

}
export const getRequest = async (endpoint) => {
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("lang") : null;
  const request = async (token) => {
    return axios.get(
      process.env.NEXT_PUBLIC_API_BASE_URL + endpoint,

      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Accept-Language": lang,
        },
      },
    );
  }
  try {
    const token = getToken();
    const response = await request(token);
    return response.data;
  } catch (error) {
    reportApiFailure(error);

    if (isAuthFailure(error)) {
      const newAccessToken = await getRefreshedAccessToken();
      if (newAccessToken) {
        try {
          const retryResponse = await request(newAccessToken);
          toast.success(retryResponse.data.message);
          return retryResponse.data;
        } catch (retryError) {
          reportApiFailure(retryError);
          showRequestError(retryError);
        }
      }
    }

    throw error;
  }
};

export const putRequest = async (endpoint, dataBody, message) => {
  if (isBrowserOffline()) throwOfflineMutationError();

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("lang") : null;
  const request = async (token) => {
    return await axios.put(
      process.env.NEXT_PUBLIC_API_BASE_URL + endpoint,
      dataBody,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Accept-Language": lang,
        },
      },
    );
  };

  const send = async () => {
    const token = getToken();
    const response = await request(token);
    toast.success(response.data.message);
    invalidateCatalogAfterAdminChange(endpoint);
    return response.data;
  };

  try {
    // Empty message means "no confirmation dialog" — the same convention as
    // postRequest(). This is required for flows where a confirmation makes no
    // sense (password reset) and prevents the empty Swal dialog bug.
    if (message === "") {
      return await send();
    }

    const result = await Swal.fire({
      icon: "info",
      title: message,
      showCancelButton: true,
      confirmButtonText: lang === "ar" ? "نعم" : "OK",
      cancelButtonText: lang === "ar" ? "إلغاء" : "Cancel",
      customClass: {
        popup: "rounded-xl shadow-lg border border-gray-200 p-6",
        title: "text-xl font-bold text-gray-800 mb-2",
        content: "text-sm text-gray-600 mb-4",
        confirmButton:
          "bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2 rounded-lg",
        cancelButton:
          "bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-lg ml-2",
      },
      reverseButtons: lang === "ar",
    });

    if (!result?.isConfirmed) {
      return null;
    }

    return await send();
  } catch (error) {
    reportApiFailure(error);

    if (isAuthFailure(error)) {
      const newAccessToken = await getRefreshedAccessToken();
      if (newAccessToken) {
        try {
          const retryResponse = await request(newAccessToken);
          toast.success(retryResponse.data.message);
          invalidateCatalogAfterAdminChange(endpoint);
          return retryResponse.data;
        } catch (retryError) {
          reportApiFailure(retryError);
          showRequestError(retryError);
        }
      }
    } else {
      showRequestError(error);
    }

    throw error;
  }
};

export const deleteRequest = async (endpoint, message) => {
  if (isBrowserOffline()) throwOfflineMutationError();

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("lang") : null;
  const request = async (token) => {
    return await axios.delete(
      process.env.NEXT_PUBLIC_API_BASE_URL + endpoint,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
          "Accept-Language": lang,
        },
      })
  }
  try {
    // 🟡 نستخدم Swal.fire مع icon: 'warning' (مش error)
    const result = await Swal.fire({
      icon: "warning",
      title: message,
      showCancelButton: true,
      confirmButtonText: lang === "ar" ? "نعم" : "OK",
      cancelButtonText: lang === "ar" ? "إلغاء" : "Cancel",
      customClass: {
        popup: "rounded-xl shadow-lg border border-gray-200 p-6",
        title: "text-xl font-bold text-gray-800 mb-2",
        content: "text-sm text-gray-600 mb-4",
        confirmButton:
          "bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2 rounded-lg",
        cancelButton:
          "bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-6 py-2 rounded-lg ml-2",
      },
      reverseButtons: lang === "ar",
    });

    if (result.isConfirmed) {
      const token = getToken();
      const response = await request(token);
      toast.success(response.data.message);
      invalidateCatalogAfterAdminChange(endpoint);
      return response.data;
    }
  } catch (error) {
    reportApiFailure(error);

    if (isAuthFailure(error)) {
      const newAccessToken = await getRefreshedAccessToken();
      if (newAccessToken) {
        try {
          const retryResponse = await request(newAccessToken);
          toast.success(retryResponse.data.message);
          invalidateCatalogAfterAdminChange(endpoint);
          return retryResponse.data;
        } catch (retryError) {
          reportApiFailure(retryError);
          showRequestError(retryError);
        }
      }
    } else {
      showRequestError(error);
    }

    throw error;
  }
};
