import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  deleteRequest,
  logoutRequest,
  postRequest,
  putRequest,
} from "../utils/requestsUtils";
import {
  clearUserScopedCaches,
  invalidateCatalogCaches,
} from "../lib/pwa/client";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    isCancel: jest.fn(() => false),
  },
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../utils/connectivityStore", () => ({
  reportApiFailure: jest.fn(),
}));

jest.mock("../lib/pwa/client", () => ({
  clearUserScopedCaches: jest.fn(() => Promise.resolve([])),
  invalidateCatalogCaches: jest.fn(() => Promise.resolve([])),
}));

function setNavigatorOnline(value) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("transaction safety for PWA/offline requests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test";
    localStorage.clear();
    setNavigatorOnline(true);
  });

  it("refuses mutations while offline and tells the user nothing was saved", async () => {
    localStorage.setItem("lang", "ar");
    setNavigatorOnline(false);

    await expect(
      postRequest("/api/shopCarts/addLine", { itemId: 1 }, ""),
    ).rejects.toMatchObject({ code: "ALFA_OFFLINE", isOffline: true });

    expect(axios.post).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("لم يتم حفظ"),
    );
  });

  it("refuses delete mutations while offline", async () => {
    setNavigatorOnline(false);

    await expect(
      deleteRequest("/api/shopCarts/deleteLine/1", "delete?"),
    ).rejects.toMatchObject({ isOffline: true });

    expect(axios.delete).not.toHaveBeenCalled();
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it("refuses update mutations while offline", async () => {
    setNavigatorOnline(false);

    await expect(
      putRequest("/api/users", { firstName: "Offline" }, "save?"),
    ).rejects.toMatchObject({ isOffline: true });

    expect(axios.put).not.toHaveBeenCalled();
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  it("invalidates catalog caches after successful admin mutations", async () => {
    axios.post.mockResolvedValue({ data: { message: "ok" } });

    await postRequest("/api/admin/items", {}, "");
    expect(invalidateCatalogCaches).toHaveBeenCalledTimes(1);

    invalidateCatalogCaches.mockClear();
    await postRequest("/api/users/language/en", "", "");
    expect(invalidateCatalogCaches).not.toHaveBeenCalled();
  });

  it("clears user-scoped PWA caches on logout", async () => {
    localStorage.setItem("accessToken", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");
    axios.post.mockResolvedValue({ data: { message: "ok" } });

    await logoutRequest();

    expect(axios.post).toHaveBeenCalledWith(
      "http://api.test/api/auth/logout",
      {},
      expect.objectContaining({
        headers: { Authorization: "Bearer access-token" },
      }),
    );
    expect(clearUserScopedCaches).toHaveBeenCalled();
  });

  it("still clears caches when no token exists", async () => {
    await logoutRequest();
    expect(axios.post).not.toHaveBeenCalled();
    expect(clearUserScopedCaches).toHaveBeenCalled();
  });
});
