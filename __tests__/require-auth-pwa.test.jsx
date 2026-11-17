import { render, screen, waitFor } from "@testing-library/react";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("../utils/authSession", () => ({
  clearAuthStorage: jest.fn(() => Promise.resolve()),
}));

import RequireAuth from "../app/user/components/RequireAuth";
import { clearAuthStorage } from "../utils/authSession";

describe("RequireAuth PWA session cleanup", () => {
  beforeEach(() => {
    localStorage.clear();
    mockReplace.mockClear();
    clearAuthStorage.mockClear();
    window.history.replaceState({}, "", "/");
  });

  it("clears account data and preserves the destination when the session is missing", async () => {
    localStorage.setItem("accessToken", "stale-access-token");
    localStorage.setItem("firstName", "Previous account");
    window.history.replaceState(
      {},
      "",
      "/user/orderdetails/42?source=email#items",
    );

    render(
      <RequireAuth>
        <div>private account content</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(clearAuthStorage).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(
        "/signin?returnUrl=%2Fuser%2Forderdetails%2F42%3Fsource%3Demail%23items",
      );
    });
    expect(screen.queryByText("private account content")).not.toBeInTheDocument();
  });

  it("keeps the default sign-in URL for a protected root path", async () => {
    render(
      <RequireAuth>
        <div>private account content</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/signin");
    });
  });

  it("renders protected content when a local session exists", async () => {
    localStorage.setItem("id", "7");
    localStorage.setItem("refreshToken", "refresh-token");

    render(
      <RequireAuth>
        <div>private account content</div>
      </RequireAuth>,
    );

    expect(await screen.findByText("private account content")).toBeInTheDocument();
    expect(clearAuthStorage).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
