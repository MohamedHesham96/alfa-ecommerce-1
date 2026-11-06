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
  });

  it("clears account data and cached pages when the session is missing", async () => {
    localStorage.setItem("accessToken", "stale-access-token");
    localStorage.setItem("firstName", "Previous account");

    render(
      <RequireAuth>
        <div>private account content</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(clearAuthStorage).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/signin");
    });
    expect(screen.queryByText("private account content")).not.toBeInTheDocument();
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
