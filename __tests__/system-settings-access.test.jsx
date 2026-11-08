import { render, screen } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }) => <img src={src} alt={alt} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }) => <a href={href}>{children}</a>,
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ locale: "en", t: (key) => key }),
}));

import SystemSettingsLayout from "../app/admin/SystemSettings/layout";

function renderLayout() {
  return render(
    <SystemSettingsLayout>
      <div>settings body</div>
    </SystemSettingsLayout>,
  );
}

describe("system settings route gate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the screen for BlueSoft-managed accounts", async () => {
    localStorage.setItem("role", "ADMIN");
    localStorage.setItem("systemSettingsAccess", "true");

    renderLayout();

    expect(await screen.findByText("settings body")).toBeInTheDocument();
  });

  it("blocks client administrators and customers", async () => {
    localStorage.setItem("role", "ADMIN");
    localStorage.setItem("systemSettingsAccess", "false");

    renderLayout();

    expect(
      await screen.findByText(/not authorized to view system settings/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("settings body")).not.toBeInTheDocument();
  });

  it("blocks non-admin sessions even if the flag was tampered with", async () => {
    localStorage.setItem("role", "USER");
    localStorage.setItem("systemSettingsAccess", "true");

    renderLayout();

    expect(
      await screen.findByText(/not authorized to view system settings/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("settings body")).not.toBeInTheDocument();
  });
});
