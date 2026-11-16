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

jest.mock("../app/admin/context/SystemSettingsAccessContext", () => ({
  useSystemSettingsAccess: jest.fn(),
}));

import SystemSettingsLayout from "../app/admin/SystemSettings/layout";
import { useSystemSettingsAccess } from "../app/admin/context/SystemSettingsAccessContext";

function renderLayout() {
  return render(
    <SystemSettingsLayout>
      <div>settings body</div>
    </SystemSettingsLayout>,
  );
}

describe("system settings route gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the screen when the backend grants access", async () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: true,
      access: { canAccessSettings: true },
    });

    renderLayout();

    expect(await screen.findByText("settings body")).toBeInTheDocument();
  });

  it("blocks client administrators when the backend denies access", async () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: false,
      access: { canAccessSettings: false },
    });

    renderLayout();

    expect(
      await screen.findByText(/not been granted access to system settings/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("settings body")).not.toBeInTheDocument();
  });

  it("does not render the settings body while permissions are loading", () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "loading",
      canAccess: false,
      access: null,
    });

    renderLayout();

    expect(screen.queryByText("settings body")).not.toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
