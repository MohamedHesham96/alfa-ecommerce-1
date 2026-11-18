import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { getRequest, postRequest, putRequest } from "../utils/requestsUtils";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
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

describe("putRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test";
    localStorage.clear();
  });

  it("skips the confirmation dialog when the message is empty", async () => {
    axios.put.mockResolvedValue({ data: { message: "ok", success: true } });

    const result = await putRequest("/api/users/reset-password", { a: 1 }, "");

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(axios.put).toHaveBeenCalledWith(
      "http://api.test/api/users/reset-password",
      { a: 1 },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: undefined }),
      }),
    );
    expect(result).toEqual({ message: "ok", success: true });
  });

  it("does not send the request when a confirmation is cancelled", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false });

    const result = await putRequest("/api/users/reset-password", { a: 1 }, "Confirm?");

    expect(result).toBeNull();
    expect(axios.put).not.toHaveBeenCalled();
  });
});

describe("forbidden customer operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test";
    localStorage.clear();
  });

  it("keeps the ADMIN session intact and stays silent for background GETs", async () => {
    localStorage.setItem("accessToken", "admin-access");
    localStorage.setItem("refreshToken", "admin-refresh");
    localStorage.setItem("role", "ADMIN");

    axios.get.mockRejectedValue({
      response: {
        status: 403,
        data: {
          success: false,
          error: {
            code: "ADMIN_OPERATION_FORBIDDEN",
            message: "This action is unavailable for administrator accounts.",
          },
        },
      },
    });

    await expect(getRequest("/api/shopCarts")).rejects.toBeTruthy();

    expect(axios.post).not.toHaveBeenCalled();
    expect(localStorage.getItem("accessToken")).toBe("admin-access");
    expect(localStorage.getItem("refreshToken")).toBe("admin-refresh");
    expect(localStorage.getItem("role")).toBe("ADMIN");
    // Cart/wishlist counters are background reads. During the login
    // navigation they can race with the role switch; their 403 is expected
    // and must not stack toasts over the dashboard.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("still explains a blocked interactive mutation", async () => {
    localStorage.setItem("accessToken", "admin-access");
    localStorage.setItem("refreshToken", "admin-refresh");
    localStorage.setItem("role", "ADMIN");

    axios.post.mockRejectedValue({
      response: {
        status: 403,
        data: {
          success: false,
          error: {
            code: "ADMIN_OPERATION_FORBIDDEN",
            message: "This action is unavailable for administrator accounts.",
          },
        },
      },
    });

    await expect(
      postRequest("/api/shopCarts/addLine", {}, ""),
    ).rejects.toBeTruthy();

    expect(toast.error).toHaveBeenCalledWith(
      "This action is unavailable for administrator accounts.",
    );
  });
});
