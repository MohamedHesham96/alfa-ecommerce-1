import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../context/LanguageContext", () => {
  const en = require("../public/locales/en.json");
  return {
    useLanguage: () => ({
      locale: "en",
      t: (key) => en[key] ?? key,
    }),
  };
});

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(),
  putRequest: jest.fn(),
}));

import ThemeSwitcher from "../app/admin/components/ThemeSwitcher";
import {
  AdminThemeProvider,
  useAdminTheme,
} from "../app/admin/context/AdminThemeContext";
import { getRequest, putRequest } from "../utils/requestsUtils";

function ThemeState() {
  const { theme, isReady } = useAdminTheme();
  return (
    <span data-testid="theme-state">
      {theme}:{String(isReady)}
    </span>
  );
}

function renderTheme() {
  return render(
    <AdminThemeProvider>
      <ThemeSwitcher />
      <ThemeState />
    </AdminThemeProvider>,
  );
}

function setAdminSession(id = "7") {
  localStorage.setItem("id", id);
  localStorage.setItem("role", "ADMIN");
  localStorage.setItem("refreshToken", "refresh-token");
}

describe("admin theme provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-admin-theme");
    document.documentElement.style.removeProperty("color-scheme");
    setAdminSession();
    getRequest.mockResolvedValue({ data: { themePreference: "DARK" } });
    putRequest.mockResolvedValue({ data: { themePreference: "DARK" } });
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-admin-theme");
    document.documentElement.style.removeProperty("color-scheme");
  });

  it("restores the database theme on mount", async () => {
    renderTheme();

    await waitFor(() =>
      expect(screen.getByTestId("theme-state")).toHaveTextContent("DARK:true"),
    );
    expect(getRequest).toHaveBeenCalledWith("/api/admin/theme");
    expect(document.documentElement).toHaveAttribute(
      "data-admin-theme",
      "dark",
    );
    expect(localStorage.getItem("adminThemePreference:7")).toBe("DARK");
  });

  it("switches immediately and persists the authenticated admin's preference", async () => {
    const user = userEvent.setup();
    renderTheme();
    await waitFor(() =>
      expect(screen.getByTestId("theme-state")).toHaveTextContent("DARK:true"),
    );

    await user.click(screen.getByRole("button", { name: /light/i }));

    expect(screen.getByTestId("theme-state")).toHaveTextContent("LIGHT:true");
    expect(document.documentElement).not.toHaveAttribute("data-admin-theme");
    expect(localStorage.getItem("adminThemePreference:7")).toBe("LIGHT");
    await waitFor(() =>
      expect(putRequest).toHaveBeenCalledWith(
        "/api/admin/theme",
        { themePreference: "LIGHT" },
        "",
      ),
    );
  });

  it("uses the per-admin cache without leaking another admin's theme", async () => {
    localStorage.setItem("adminThemePreference:8", "DARK");
    localStorage.setItem("adminThemePreference:7", "LIGHT");
    getRequest.mockResolvedValue({ data: { themePreference: "LIGHT" } });

    renderTheme();

    await waitFor(() =>
      expect(screen.getByTestId("theme-state")).toHaveTextContent("LIGHT:true"),
    );
    expect(document.documentElement).not.toHaveAttribute("data-admin-theme");
  });

  it("keeps the dashboard usable when the preference API fails", async () => {
    localStorage.setItem("adminThemePreference:7", "DARK");
    getRequest.mockRejectedValue(new Error("network down"));

    renderTheme();

    await waitFor(() =>
      expect(screen.getByTestId("theme-state")).toHaveTextContent("DARK:true"),
    );
    expect(document.documentElement).toHaveAttribute(
      "data-admin-theme",
      "dark",
    );
  });
});
