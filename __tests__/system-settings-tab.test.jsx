import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, priority, ...props }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

jest.mock("../utils/requestsUtils", () => ({
  logoutRequest: jest.fn(),
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ t: (key) => key, locale: "en" }),
}));

jest.mock("../context/AppConfigContext", () => ({
  useAppConfig: () => false,
}));

jest.mock("../context/namePageInAdmin.jsx", () => ({
  useNamePageInAdminContext: () => ({
    selectedNamePage: "",
    setSelectedNamePage: jest.fn(),
  }),
}));

jest.mock("../app/admin/context/SystemSettingsAccessContext", () => ({
  useSystemSettingsAccess: jest.fn(),
}));

import SideMenu from "../app/admin/components/SideMenu";
import { useSystemSettingsAccess } from "../app/admin/context/SystemSettingsAccessContext";

describe("system settings sidebar tab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("shows the tab only after the backend grants access", () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "loading",
      canAccess: false,
    });

    const { rerender } = render(<SideMenu />);
    expect(screen.queryByText("system_settings")).not.toBeInTheDocument();

    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: true,
    });
    rerender(<SideMenu />);

    expect(screen.getByText("system_settings").closest("a")).toHaveAttribute(
      "href",
      "/admin/SystemSettings",
    );
  });

  it("hides the tab when global access is disabled or no setting is visible", () => {
    useSystemSettingsAccess.mockReturnValue({
      status: "ready",
      canAccess: false,
    });

    render(<SideMenu />);

    expect(screen.queryByText("system_settings")).not.toBeInTheDocument();
  });
});
