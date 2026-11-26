import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("../context/AppConfigContext", () => ({
  useAppConfig: jest.fn(),
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ t: (key) => key, locale: "en" }),
}));

jest.mock("../app/admin/context/SystemSettingsAccessContext", () => ({
  useSystemSettingsAccess: jest.fn(),
}));

jest.mock("../app/admin/Areas/components/AreaTable", () => ({
  __esModule: true,
  default: () => <div data-testid="area-table" />,
}));

jest.mock("../app/admin/Areas/components/AreaForm", () => ({
  __esModule: true,
  default: () => <div data-testid="area-form" />,
}));

import AreasPage from "../app/admin/Areas/page";
import { useSystemSettingsAccess } from "../app/admin/context/SystemSettingsAccessContext";
import { useAppConfig } from "../context/AppConfigContext";

describe("areas admin page access", () => {
  beforeEach(() => {
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: true,
    });
  });

  it("blocks direct access while the areas feature is disabled", () => {
    useAppConfig.mockReturnValue(false);
    render(<AreasPage />);

    expect(screen.getByText("areas_disabled_title")).toBeInTheDocument();
    expect(screen.getByText("areas_disabled")).toBeInTheDocument();
    expect(screen.queryByTestId("area-table")).not.toBeInTheDocument();
    expect(screen.getByText("system_settings").closest("a")).toHaveAttribute(
      "href",
      "/admin/SystemSettings",
    );
  });

  it("hides the settings shortcut when system settings access is denied", () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: false,
    });
    useAppConfig.mockReturnValue(false);
    render(<AreasPage />);

    expect(screen.getByText("areas_disabled_title")).toBeInTheDocument();
    expect(screen.queryByText("system_settings")).not.toBeInTheDocument();
  });

  it("renders the management screen when the feature is enabled", () => {
    useAppConfig.mockReturnValue(true);
    render(<AreasPage />);

    expect(screen.getByText("areas_management")).toBeInTheDocument();
    expect(screen.getByText("areas_description")).toBeInTheDocument();
    expect(screen.getByTestId("area-table")).toBeInTheDocument();
  });
});
