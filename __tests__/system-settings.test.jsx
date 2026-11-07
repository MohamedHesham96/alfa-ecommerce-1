import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock("../context/AppConfigContext", () => ({
  useAppConfigContext: () => ({ refresh: mockRefresh }),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../app/admin/services/systemConfigurationService", () => ({
  fetchConfigurationAudit: jest.fn(),
  fetchSystemConfiguration: jest.fn(),
  updateSystemConfiguration: jest.fn(),
  bulkUpdateSystemConfiguration: jest.fn(),
  resetSystemConfiguration: jest.fn(),
  resetAllSystemConfiguration: jest.fn(),
  validateSystemConfiguration: jest.fn(),
  previewSystemConfiguration: jest.fn(),
}));

import SystemSettingsPage from "../app/admin/SystemSettings/page";
import {
  fetchConfigurationAudit,
  fetchSystemConfiguration,
  resetAllSystemConfiguration,
  resetSystemConfiguration,
  updateSystemConfiguration,
  validateSystemConfiguration,
} from "../app/admin/services/systemConfigurationService";

function definition(overrides) {
  return {
    key: "features.wishlist.enabled",
    category: "features",
    type: "BOOLEAN",
    displayName: "Wishlist",
    displayNameAr: "قائمة الأمنيات",
    description: "Allows customers to save products.",
    descriptionAr: "يسمح للعملاء بحفظ المنتجات.",
    defaultValue: true,
    options: [],
    constraints: {
      min: null,
      max: null,
      minLength: null,
      maxLength: null,
      pattern: null,
      required: false,
      nullable: false,
      multiline: false,
      elementType: null,
      requiredJsonFields: [],
    },
    editable: true,
    readOnly: false,
    sensitive: false,
    featureFlag: true,
    frontendExposed: true,
    publicExposed: true,
    authenticatedExposed: false,
    adminVisible: true,
    experimental: false,
    deprecated: false,
    cacheInvalidationRequired: true,
    activation: "IMMEDIATE",
    requiresRestart: false,
    version: 1,
    subsystem: "core",
    order: 10,
    ...overrides,
  };
}

function setting(definitionOverrides, settingOverrides = {}) {
  return {
    definition: definition(definitionOverrides),
    value: true,
    source: "DEFAULT",
    overridden: false,
    invalidStoredValue: false,
    storedVersion: -1,
    valueMasked: false,
    hasStoredValue: false,
    ...settingOverrides,
  };
}

const wishlist = setting({}, {});
const productsPerPage = setting(
  {
    key: "catalog.productsPerPage",
    category: "catalog",
    type: "INTEGER",
    displayName: "Products per page",
    displayNameAr: "عدد المنتجات في الصفحة",
    description: "Default page size.",
    descriptionAr: "حجم الصفحة الافتراضي.",
    defaultValue: 12,
    featureFlag: false,
    frontendExposed: true,
    publicExposed: true,
    constraints: {
      min: 4,
      max: 60,
      minLength: null,
      maxLength: null,
      pattern: null,
      required: false,
      nullable: false,
      multiline: false,
      elementType: null,
      requiredJsonFields: [],
    },
    order: 30,
  },
  { value: 12 },
);
const galleryLayout = setting(
  {
    key: "product.gallery.layout",
    category: "catalog",
    type: "ENUM",
    displayName: "Gallery layout",
    displayNameAr: "تخطيط المعرض",
    description: "Gallery layout.",
    descriptionAr: "تخطيط المعرض.",
    defaultValue: "THUMBNAILS_SIDE",
    featureFlag: false,
    frontendExposed: true,
    publicExposed: true,
    options: [
      { value: "THUMBNAILS_SIDE", label: "Side", labelAr: "جانبي" },
      { value: "SLIDER_ONLY", label: "Slider", labelAr: "سلايدر" },
    ],
    order: 10,
  },
  { value: "THUMBNAILS_SIDE" },
);

const configurationResponse = {
  categories: [
    {
      code: "features",
      displayName: "Features",
      displayNameAr: "الميزات",
      description: "",
      descriptionAr: "",
      order: 190,
      settingCount: 1,
    },
    {
      code: "catalog",
      displayName: "Catalog",
      displayNameAr: "الكتالوج",
      description: "",
      descriptionAr: "",
      order: 70,
      settingCount: 2,
    },
  ],
  settings: [wishlist, productsPerPage, galleryLayout],
  generatedAt: Date.now(),
  cacheTtlSeconds: 30,
};

async function renderPage() {
  fetchSystemConfiguration.mockResolvedValue(configurationResponse);
  render(<SystemSettingsPage />);
  await screen.findByText("قائمة الأمنيات");
}

describe("system settings admin screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefresh.mockResolvedValue(undefined);
    updateSystemConfiguration.mockResolvedValue({
      ...wishlist,
      value: false,
      source: "DATABASE",
      overridden: true,
      storedVersion: 0,
    });
    fetchConfigurationAudit.mockResolvedValue({ content: [] });
  });

  it("renders definitions, categories, and dynamic controls", async () => {
    await renderPage();

    expect(screen.getByText("إعدادات النظام")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الميزات/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الكتالوج/ })).toBeInTheDocument();

    const wishlistCard = screen.getByText("قائمة الأمنيات").closest("article");
    const pageCard = screen
      .getByText("عدد المنتجات في الصفحة")
      .closest("article");
    const galleryCard = screen.getByText("تخطيط المعرض").closest("article");

    expect(within(wishlistCard).getByRole("switch")).toBeInTheDocument();
    expect(within(pageCard).getByRole("spinbutton")).toHaveValue(12);
    expect(within(galleryCard).getByRole("combobox")).toHaveValue(
      "THUMBNAILS_SIDE",
    );
  });

  it("filters by search text, category, and type", async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(
      screen.getByPlaceholderText("ابحث بالاسم أو المفتاح أو الوصف..."),
      "productsPerPage",
    );
    expect(screen.getByText("عدد المنتجات في الصفحة")).toBeInTheDocument();
    expect(screen.queryByText("قائمة الأمنيات")).not.toBeInTheDocument();

    await user.clear(
      screen.getByPlaceholderText("ابحث بالاسم أو المفتاح أو الوصف..."),
    );
    await user.click(screen.getByRole("button", { name: /الكتالوج/ }));
    expect(screen.getByText("عدد المنتجات في الصفحة")).toBeInTheDocument();
    expect(screen.queryByText("قائمة الأمنيات")).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("تصفية حسب النوع"),
      "ENUM",
    );
    expect(screen.getByText("تخطيط المعرض")).toBeInTheDocument();
    expect(screen.queryByText("عدد المنتجات في الصفحة")).not.toBeInTheDocument();
  });

  it("saves a single changed setting", async () => {
    const user = userEvent.setup();
    await renderPage();

    const card = screen.getByText("قائمة الأمنيات").closest("article");
    await user.click(within(card).getByRole("switch"));
    await user.click(within(card).getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(updateSystemConfiguration).toHaveBeenCalledWith(
        "features.wishlist.enabled",
        false,
        0,
      );
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows backend validation errors", async () => {
    const user = userEvent.setup();
    await renderPage();
    validateSystemConfiguration.mockResolvedValue({
      valid: false,
      errors: [
        { key: "features.wishlist.enabled", message: "قيمة غير صالحة" },
      ],
    });

    const card = screen.getByText("قائمة الأمنيات").closest("article");
    await user.click(within(card).getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "تحقق" }));

    expect(await screen.findByText("قيمة غير صالحة")).toBeInTheDocument();
  });

  it("resets a stored override after confirmation", async () => {
    const user = userEvent.setup();
    fetchSystemConfiguration.mockResolvedValue({
      ...configurationResponse,
      settings: [
        {
          ...wishlist,
          value: false,
          source: "DATABASE",
          overridden: true,
          storedVersion: 2,
        },
        productsPerPage,
        galleryLayout,
      ],
    });
    resetSystemConfiguration.mockResolvedValue(wishlist);
    render(<SystemSettingsPage />);
    await screen.findByText("قائمة الأمنيات");

    const card = screen.getByText("قائمة الأمنيات").closest("article");
    await user.click(
      within(card).getByRole("button", {
        name: "إعادة التعيين إلى الافتراضي",
      }),
    );
    await user.click(screen.getByRole("button", { name: "إعادة التعيين" }));

    await waitFor(() => {
      expect(resetSystemConfiguration).toHaveBeenCalledWith(
        "features.wishlist.enabled",
        2,
      );
    });
  });

  it("loads the configuration audit history", async () => {
    const user = userEvent.setup();
    await renderPage();
    fetchConfigurationAudit.mockResolvedValue({
      content: [
        {
          auditId: 1,
          key: "catalog.showSku",
          action: "SET",
          changedBy: "admin",
          changedDate: "2026-01-01T00:00:00",
          redacted: false,
          oldValue: true,
          newValue: false,
        },
      ],
    });

    await user.click(screen.getByRole("button", { name: "سجل التغييرات" }));

    expect(await screen.findByText("catalog.showSku")).toBeInTheDocument();
    expect(screen.getByText("SET")).toBeInTheDocument();
  });

  it("requires confirmation before resetting all overrides", async () => {
    const user = userEvent.setup();
    await renderPage();
    resetAllSystemConfiguration.mockResolvedValue(2);

    await user.click(screen.getByRole("button", { name: "إعادة تعيين الكل" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "إعادة تعيين الكل",
      }),
    );

    await waitFor(() => {
      expect(resetAllSystemConfiguration).toHaveBeenCalledTimes(1);
    });
    expect(fetchSystemConfiguration).toHaveBeenCalledTimes(2);
  });
});
