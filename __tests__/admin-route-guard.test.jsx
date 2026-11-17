import { render, screen, waitFor } from "@testing-library/react";

const mockReplace = jest.fn();
let mockAuthState = {
  role: null,
  ready: false,
  hasSession: false,
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }) => {
    const React = require("react");
    return React.createElement("img", props);
  },
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ locale: "en" }),
}));

jest.mock("../utils/authRole", () => ({
  useAuthRole: () => mockAuthState,
}));

jest.mock("../utils/authSession", () => ({
  clearAuthStorage: jest.fn(() => Promise.resolve()),
}));

import AdminRouteGuard from "../app/admin/components/AdminRouteGuard";
import { clearAuthStorage } from "../utils/authSession";

describe("AdminRouteGuard return URL handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      role: null,
      ready: false,
      hasSession: false,
    };
    window.history.replaceState({}, "", "/admin/orders/OrdersDetails/42");
  });

  it("redirects a guest to sign in with the complete order URL", async () => {
    mockAuthState = { role: null, ready: true, hasSession: false };
    window.history.replaceState(
      {},
      "",
      "/admin/orders/OrdersDetails/42?tab=items#timeline",
    );

    render(
      <AdminRouteGuard>
        <div>private order content</div>
      </AdminRouteGuard>,
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/signin?returnUrl=%2Fadmin%2Forders%2FOrdersDetails%2F42%3Ftab%3Ditems%23timeline",
      ),
    );
    expect(screen.queryByText("private order content")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-route-loading")).toBeInTheDocument();
    expect(clearAuthStorage).toHaveBeenCalledTimes(1);
  });

  it("opens the admin order directly for an authorized admin session", () => {
    mockAuthState = { role: "ADMIN", ready: true, hasSession: true };

    render(
      <AdminRouteGuard>
        <div>private order content</div>
      </AdminRouteGuard>,
    );

    expect(screen.getByText("private order content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(clearAuthStorage).not.toHaveBeenCalled();
  });

  it("shows the forbidden page for a logged-in non-admin session", () => {
    mockAuthState = { role: "USER", ready: true, hasSession: true };

    render(
      <AdminRouteGuard>
        <div>private order content</div>
      </AdminRouteGuard>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /not authorized to view this page/i,
    );
    expect(screen.queryByText("private order content")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not trust a stale admin role when the local session is missing", async () => {
    mockAuthState = { role: "ADMIN", ready: true, hasSession: false };

    render(
      <AdminRouteGuard>
        <div>private order content</div>
      </AdminRouteGuard>,
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        "/signin?returnUrl=%2Fadmin%2Forders%2FOrdersDetails%2F42",
      ),
    );
    expect(screen.queryByText("private order content")).not.toBeInTheDocument();
  });

  it("shows loading without redirecting until the stored session is read", () => {
    render(
      <AdminRouteGuard>
        <div>private order content</div>
      </AdminRouteGuard>,
    );

    expect(screen.getByTestId("admin-route-loading")).toBeInTheDocument();
    expect(screen.queryByText("private order content")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
