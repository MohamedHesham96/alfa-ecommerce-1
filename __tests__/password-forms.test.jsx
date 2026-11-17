import React from "react";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPassword from "../app/components/ForgotPassword_form";
import SignInForm from "../app/components/SignIn_Form";
import ResetPasswordForm from "../app/user/profile/components/ResetPasswordForm";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
let mockSearchParams = "";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(mockSearchParams),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }) => <img src={src} alt={alt} />,
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "en",
    setLocale: jest.fn(),
    t: (key) => key,
  }),
}));

jest.mock("../utils/requestsUtils", () => ({
  postRequest: jest.fn(),
  putRequest: jest.fn(),
}));

jest.mock("../utils/connectivityStore", () => ({
  reportApiFailure: jest.fn(),
}));

jest.mock("../utils/languageUtils", () => ({
  resolveLanguage: jest.fn(() => "en"),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const { toast } = require("react-toastify");

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

jest.mock("../lib/pwa/client", () => ({
  clearUserScopedCaches: jest.fn(() => Promise.resolve()),
}));

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const { postRequest, putRequest } = require("../utils/requestsUtils");

describe("ForgotPassword page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = "";
    localStorage.clear();
    window.history.replaceState({}, "", "/forgotpassword");
  });

  it("requests a reset email with POST JSON, not GET query parameters", async () => {
    const user = userEvent.setup();
    postRequest.mockResolvedValue({ success: true });

    render(<ForgotPassword />);

    await user.type(screen.getByLabelText("email"), "john@example.com");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => {
      expect(postRequest).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        { email: "john@example.com" },
        "",
        false,
        { suppressErrorToast: true },
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "forgotPasswordEmailSent",
    );
  });

  it("reads the token, sends the reset payload with PUT, and never throws on confirm-password typing", async () => {
    const user = userEvent.setup();
    mockSearchParams = "token=11111111-1111-1111-1111-111111111111";
    putRequest.mockResolvedValue({ success: true });

    render(<ForgotPassword />);

    await user.type(screen.getByLabelText("newPassword"), "newPassword123");
    // This line specifically reproduces the old setConfirmPassword runtime bug.
    await user.type(
      screen.getByLabelText("confirmPassword"),
      "newPassword123",
    );
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(putRequest).toHaveBeenCalledWith(
        "/api/auth/rest-forget-password",
        {
          token: "11111111-1111-1111-1111-111111111111",
          newPassword: "newPassword123",
          repeatPassword: "newPassword123",
        },
        "",
        { suppressErrorToast: true, suppressSuccessToast: true },
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent("resetSuccess");
  });

  it("does not call the API when the two passwords differ", async () => {
    const user = userEvent.setup();
    mockSearchParams = "token=11111111-1111-1111-1111-111111111111";

    render(<ForgotPassword />);

    await user.type(screen.getByLabelText("newPassword"), "newPassword123");
    await user.type(screen.getByLabelText("confirmPassword"), "different123");
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(putRequest).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "passwordMismatch",
    );
  });
});

describe("SignIn forgot-password form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    postRequest.mockResolvedValue({ success: true });
  });

  it("uses POST JSON and displays a success message", async () => {
    const user = userEvent.setup();
    render(<SignInForm popUp={false} />);

    await user.click(screen.getByText("forgotPassword"));
    await user.type(screen.getByPlaceholderText("email"), "john@example.com");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => {
      expect(postRequest).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        { email: "john@example.com" },
        "",
        false,
        { suppressErrorToast: true },
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "forgotPasswordEmailSent",
    );
  });

  it("does not submit the forgot-password form when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<SignInForm popUp={false} />);

    await user.click(screen.getByText("forgotPassword"));
    await user.type(screen.getByPlaceholderText("email"), "john@example.com");
    await user.click(screen.getByRole("button", { name: "cancel" }));

    expect(postRequest).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordForm (authenticated change)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("accessToken", "access");
    localStorage.setItem("refreshToken", "refresh");
    putRequest.mockResolvedValue({ success: true });
  });

  it("submits the correct payload, closes the modal, clears tokens and redirects", async () => {
    const user = userEvent.setup();
    const setIsFormOpen = jest.fn();

    render(
      <ResetPasswordForm isFormOpen setIsFormOpen={setIsFormOpen} />,
    );

    await user.type(screen.getByLabelText("oldPassword"), "oldPassword123");
    await user.type(screen.getByLabelText("newPassword"), "newPassword123");
    await user.type(
      screen.getByLabelText("confirmPassword"),
      "newPassword123",
    );
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => {
      expect(putRequest).toHaveBeenCalledWith(
        "/api/users/reset-password",
        {
          oldPassword: "oldPassword123",
          newPassword: "newPassword123",
          repeatPassword: "newPassword123",
        },
        "",
        { suppressErrorToast: true },
      );
    });
    expect(setIsFormOpen).toHaveBeenCalledWith(false);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });

  it("does not submit or leak passwords when the close button is clicked", async () => {
    const user = userEvent.setup();
    const setIsFormOpen = jest.fn();

    render(
      <ResetPasswordForm isFormOpen setIsFormOpen={setIsFormOpen} />,
    );

    await user.type(screen.getByLabelText("oldPassword"), "oldPassword123");
    await user.type(screen.getByLabelText("newPassword"), "newPassword123");
    await user.click(screen.getByRole("button", { name: "close" }));

    expect(putRequest).not.toHaveBeenCalled();
    expect(setIsFormOpen).toHaveBeenCalledWith(false);
  });
});

describe("SignIn post-login destination", () => {
  const adminSession = {
    data: {
      message: "ok",
      accessToken: "admin-access",
      refreshToken: "admin-refresh",
      userDetails: {
        userId: 1,
        firstName: "Admin",
        role: "ADMIN",
        language: "en",
        systemSettingsAccess: false,
      },
    },
  };

  const customerSession = {
    data: {
      message: "ok",
      accessToken: "customer-access",
      refreshToken: "customer-refresh",
      userDetails: {
        userId: 7,
        firstName: "Customer",
        role: "USER",
        language: "en",
        systemSettingsAccess: false,
      },
    },
  };

  const submitLogin = async () => {
    const user = userEvent.setup();

    render(<SignInForm popUp={false} />);
    await user.type(screen.getByPlaceholderText("username"), "alfa-user");
    await user.type(screen.getByPlaceholderText("password"), "secret123");
    await user.click(screen.getByRole("button", { name: "login" }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, "", "/signin");
    axios.post.mockResolvedValue(adminSession);
  });

  it("returns to the exact requested order after a successful login", async () => {
    window.history.replaceState(
      {},
      "",
      "/signin?returnUrl=%2Fadmin%2Forders%2FOrdersDetails%2F42%3Ftab%3Ditems%23timeline",
    );

    await submitLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/admin/orders/OrdersDetails/42?tab=items#timeline",
      ),
    );
    expect(mockReplace).not.toHaveBeenCalledWith("/admin/Dashboard");
  });

  it("keeps the existing admin destination when no return URL is present", async () => {
    await submitLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/admin/Dashboard"),
    );
  });

  it("keeps the existing customer destination when no return URL is present", async () => {
    axios.post.mockResolvedValue(customerSession);

    await submitLogin();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("resumes the requested URL for a role that must be checked by the route guard", async () => {
    axios.post.mockResolvedValue(customerSession);
    window.history.replaceState(
      {},
      "",
      "/signin?returnUrl=%2Fadmin%2Forders%2FOrdersDetails%2F42",
    );

    await submitLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/admin/orders/OrdersDetails/42",
      ),
    );
    // The admin route guard is responsible for showing Forbidden; the login
    // form must not silently downgrade the user to a different page.
    expect(mockReplace).not.toHaveBeenCalledWith("/");
  });

  it("ignores an external return URL and uses the safe default", async () => {
    window.history.replaceState(
      {},
      "",
      "/signin?returnUrl=https%3A%2F%2Fevil.example%2Forder%2F42",
    );

    await submitLogin();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/admin/Dashboard"),
    );
  });

  it("stays on the sign-in page and preserves the destination after a failed login", async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: { message: "Invalid credentials" } } },
    });
    window.history.replaceState(
      {},
      "",
      "/signin?returnUrl=%2Fuser%2Forderdetails%2F7",
    );

    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials",
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(window.location.search).toContain(
      "returnUrl=%2Fuser%2Forderdetails%2F7",
    );
  });
});
