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

jest.mock("../app/admin/PickupPlaces/components/PickupPlaceTable", () => ({
  __esModule: true,
  default: () => <div data-testid="pickup-place-table" />,
}));

jest.mock("../app/admin/PickupPlaces/components/PickupPlaceForm", () => ({
  __esModule: true,
  default: () => <div data-testid="pickup-place-form" />,
}));

import PickupPlacesPage from "../app/admin/PickupPlaces/page";
import { useSystemSettingsAccess } from "../app/admin/context/SystemSettingsAccessContext";
import { useAppConfig } from "../context/AppConfigContext";

describe("pickup places admin page access", () => {
  beforeEach(() => {
    localStorage.clear();
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: true,
    });
  });

  it("blocks direct access while pickup is disabled", async () => {
    useAppConfig.mockReturnValue(false);
    render(<PickupPlacesPage />);

    expect(
      screen.getByText("pickup_places_disabled_title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("pickup_places_disabled"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("pickup-place-table"),
    ).not.toBeInTheDocument();
    expect(
      (await screen.findByText("system_settings")).closest("a"),
    ).toHaveAttribute("href", "/admin/SystemSettings");
  });

  it("hides the system settings shortcut when access is denied", () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: false,
    });
    useAppConfig.mockReturnValue(false);
    render(<PickupPlacesPage />);

    expect(
      screen.getByText("pickup_places_disabled_title"),
    ).toBeInTheDocument();
    expect(screen.queryByText("system_settings")).not.toBeInTheDocument();
  });

  it("renders the management screen when pickup is enabled", () => {
    useAppConfig.mockReturnValue(true);
    render(<PickupPlacesPage />);

    expect(screen.getByText("pickup_places")).toBeInTheDocument();
    expect(
      screen.getByText("pickup_places_description"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pickup-place-table")).toBeInTheDocument();
  });
});
