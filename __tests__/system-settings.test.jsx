import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";

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
  updateClientVisibility: jest.fn(),
  updateSystemConfiguration: jest.fn(),
  bulkUpdateSystemConfiguration: jest.fn(),
  resetSystemConfiguration: jest.fn(),
  resetAllSystemConfiguration: jest.fn(),
  validateSystemConfiguration: jest.fn(),
  previewSystemConfiguration: jest.fn(),
  uploadSystemConfigurationImage: jest.fn(),
}));

import SystemSettingsPage from "../app/admin/SystemSettings/page";
import {
  bulkUpdateSystemConfiguration,
  fetchConfigurationAudit,
  fetchSystemConfiguration,
  resetAllSystemConfiguration,
  resetSystemConfiguration,
  updateClientVisibility,
  updateSystemConfiguration,
  uploadSystemConfigurationImage,
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
    visibleToClientAdmins: false,
    clientVisibilityConfigurable: true,
    ...settingOverrides,
  };
}

const internalViewer = {
  internalAdmin: true,
  clientAdmin: false,
  globalClientAccessEnabled: false,
  globalClientEditingEnabled: false,
  canAccessSettings: true,
  canEditSettings: true,
  visibleSettingCount: 3,
};

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

const orderNotificationEmail = setting(
  {
    key: "notifications.orderNotificationEmail",
    category: "notifications",
    type: "EMAIL",
    displayName: "Order Notification Email",
    displayNameAr: "بريد إشعارات الطلبات",
    description:
      "Email address that receives notifications whenever a new order is placed.",
    descriptionAr:
      "عنوان البريد الإلكتروني الذي يستقبل الإشعارات عند إنشاء طلب جديد.",
    defaultValue: "old-admin@example.com",
    featureFlag: false,
    frontendExposed: false,
    publicExposed: false,
    authenticatedExposed: false,
    constraints: {
      min: null,
      max: null,
      minLength: null,
      maxLength: null,
      pattern: null,
      required: false,
      nullable: true,
      multiline: false,
      elementType: null,
      requiredJsonFields: [],
    },
    subsystem: "notifications",
    order: 10,
  },
  { value: "old-admin@example.com" },
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
  viewer: internalViewer,
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

    const wishlistSwitch = within(wishlistCard).getByRole("switch");
    expect(wishlistSwitch).toHaveClass("admin-switch");
    expect(wishlistSwitch).toHaveClass("admin-switch--on");
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

  it("renders grouped settings as one card and saves their changes together", async () => {
    const user = userEvent.setup();
    const group = {
      category: "payments",
      groupKey: "payments.instapayBankAccount",
      groupDisplayName: "InstaPay (bank account)",
      groupDisplayNameAr: "إنستاباي (حساب بنكي)",
    };
    const enabled = setting(
      {
        ...group,
        key: "payments.instapayBankAccount.enabled",
        displayName: "InstaPay (bank account) payment",
        displayNameAr: "الدفع عبر إنستاباي (حساب بنكي)",
        description: "Enables the payment method.",
        descriptionAr: "يفعّل طريقة الدفع.",
      },
      { value: true },
    );
    const accountName = setting(
      {
        ...group,
        key: "payments.instapayBankAccount.accountName",
        type: "STRING",
        displayName: "Account name",
        displayNameAr: "اسم الحساب",
        description: "Account holder name.",
        descriptionAr: "اسم صاحب الحساب.",
        defaultValue: "كيرلس ابراهيم عثم ملك",
        featureFlag: false,
        frontendExposed: true,
        publicExposed: true,
        constraints: {
          min: null,
          max: null,
          minLength: null,
          maxLength: 120,
          pattern: null,
          required: false,
          nullable: false,
          multiline: false,
          elementType: null,
          requiredJsonFields: [],
        },
      },
      { value: "كيرلس ابراهيم عثم ملك" },
    );
    const groupedResponse = {
      categories: [
        {
          code: "payments",
          displayName: "Payments",
          displayNameAr: "المدفوعات",
          description: "",
          descriptionAr: "",
          order: 130,
          settingCount: 2,
        },
      ],
      settings: [enabled, accountName],
      generatedAt: Date.now(),
      cacheTtlSeconds: 30,
      viewer: { ...internalViewer, visibleSettingCount: 2 },
    };
    fetchSystemConfiguration.mockResolvedValue(groupedResponse);
    bulkUpdateSystemConfiguration.mockResolvedValue({
      ...groupedResponse,
      settings: [
        enabled,
        {
          ...accountName,
          value: "Alfa Group",
          source: "DATABASE",
          overridden: true,
          storedVersion: 0,
        },
      ],
    });

    render(<SystemSettingsPage />);
    await screen.findByText("إنستاباي (حساب بنكي)");

    const card = screen.getByText("إنستاباي (حساب بنكي)").closest("article");
    expect(within(card).getByText("اسم الحساب")).toBeInTheDocument();
    expect(
      within(card).getByText("الدفع عبر إنستاباي (حساب بنكي)"),
    ).toBeInTheDocument();

    const input = within(card).getByDisplayValue("كيرلس ابراهيم عثم ملك");
    await user.clear(input);
    await user.type(input, "Alfa Group");
    await user.click(within(card).getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(bulkUpdateSystemConfiguration).toHaveBeenCalledWith([
        {
          key: "payments.instapayBankAccount.accountName",
          value: "Alfa Group",
          version: 0,
        },
      ]);
    });
  });

  it("uploads IMAGE settings as files and shows a preview", async () => {
    const user = userEvent.setup();
    const imageSetting = setting(
      {
        key: "instapay.qr",
        category: "payments",
        type: "IMAGE",
        displayName: "InstaPay QR image",
        displayNameAr: "صورة QR الدفع عبر إنستاباي",
        description: "Optional QR image.",
        descriptionAr: "صورة QR اختيارية.",
        defaultValue: "",
        featureFlag: false,
        frontendExposed: true,
        publicExposed: true,
        groupKey: "payments.instapay",
        groupDisplayName: "InstaPay",
        groupDisplayNameAr: "إنستاباي",
        constraints: {
          min: null,
          max: null,
          minLength: null,
          maxLength: 1000,
          pattern: null,
          required: false,
          nullable: true,
          multiline: false,
          elementType: null,
          requiredJsonFields: [],
        },
        order: 22,
      },
      { value: "" },
    );

    fetchSystemConfiguration.mockResolvedValue({
      categories: [
        {
          code: "payments",
          displayName: "Payments",
          displayNameAr: "المدفوعات",
          description: "",
          descriptionAr: "",
          order: 130,
          settingCount: 1,
        },
      ],
      settings: [imageSetting],
      generatedAt: Date.now(),
      cacheTtlSeconds: 30,
      viewer: { ...internalViewer, visibleSettingCount: 1 },
    });
    uploadSystemConfigurationImage.mockResolvedValue({
      ...imageSetting,
      value: "/images/system-settings/qr-code.png",
      source: "DATABASE",
      overridden: true,
      storedVersion: 0,
    });

    render(<SystemSettingsPage />);
    await screen.findByText("صورة QR الدفع عبر إنستاباي");

    const card = screen
      .getByText("صورة QR الدفع عبر إنستاباي")
      .closest("article");
    expect(
      within(card).getByRole("button", { name: "رفع صورة" }),
    ).toBeInTheDocument();
    expect(within(card).queryByRole("textbox")).not.toBeInTheDocument();

    const fileInput = within(card).getByLabelText("رفع صورة");
    const file = new File([new Uint8Array([137, 80, 78, 71])], "qr.png", {
      type: "image/png",
    });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(uploadSystemConfigurationImage).toHaveBeenCalledWith(
        "instapay.qr",
        file,
        0,
      );
    });

    const preview = await within(card).findByRole("img");
    expect(preview.getAttribute("src")).toContain(
      "/images/system-settings/qr-code.png",
    );
    expect(toast.success).toHaveBeenCalledWith("تم رفع الصورة.");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("loads, validates, and saves the order notification email", async () => {
    const user = userEvent.setup();
    fetchSystemConfiguration.mockResolvedValue({
      categories: [
        {
          code: "notifications",
          displayName: "Notifications",
          displayNameAr: "الإشعارات",
          description: "",
          descriptionAr: "",
          order: 150,
          settingCount: 1,
        },
      ],
      settings: [orderNotificationEmail],
      generatedAt: Date.now(),
      cacheTtlSeconds: 30,
      viewer: { ...internalViewer, visibleSettingCount: 1 },
    });
    updateSystemConfiguration.mockResolvedValue({
      ...orderNotificationEmail,
      value: "new-admin@example.com",
      source: "DATABASE",
      overridden: true,
      storedVersion: 0,
    });

    render(<SystemSettingsPage />);
    await screen.findByText("بريد إشعارات الطلبات");

    const card = screen.getByText("بريد إشعارات الطلبات").closest("article");
    const input = within(card).getByDisplayValue("old-admin@example.com");
    expect(input).toHaveAttribute("type", "email");

    await user.clear(input);
    await user.type(input, "new-admin@example.com");
    await user.click(within(card).getByRole("button", { name: "حفظ" }));

    await waitFor(() => {
      expect(updateSystemConfiguration).toHaveBeenCalledWith(
        "notifications.orderNotificationEmail",
        "new-admin@example.com",
        0,
      );
    });
    expect(toast.success).toHaveBeenCalledWith("تم حفظ الإعداد.");
  });

  it("shows the backend validation error for an invalid notification email", async () => {
    const user = userEvent.setup();
    fetchSystemConfiguration.mockResolvedValue({
      categories: [],
      settings: [orderNotificationEmail],
      generatedAt: Date.now(),
      cacheTtlSeconds: 30,
      viewer: { ...internalViewer, visibleSettingCount: 1 },
    });
    updateSystemConfiguration.mockRejectedValue({
      response: {
        data: {
          error: {
            details: {
              "notifications.orderNotificationEmail":
                "value is not a valid email address",
            },
          },
        },
      },
    });

    render(<SystemSettingsPage />);
    await screen.findByText("بريد إشعارات الطلبات");

    const card = screen.getByText("بريد إشعارات الطلبات").closest("article");
    const input = within(card).getByDisplayValue("old-admin@example.com");
    await user.clear(input);
    await user.type(input, "bad-email");
    await user.click(within(card).getByRole("button", { name: "حفظ" }));

    expect(
      await screen.findByText("value is not a valid email address"),
    ).toBeInTheDocument();
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

  it("renders client-authorized settings read-only when editing is disabled", async () => {
    fetchSystemConfiguration.mockResolvedValue({
      categories: [configurationResponse.categories[0]],
      settings: [wishlist],
      generatedAt: Date.now(),
      cacheTtlSeconds: 30,
      viewer: {
        internalAdmin: false,
        clientAdmin: true,
        globalClientAccessEnabled: true,
        globalClientEditingEnabled: false,
        canAccessSettings: true,
        canEditSettings: false,
        visibleSettingCount: 1,
      },
    });

    render(<SystemSettingsPage />);
    await screen.findByText("قائمة الأمنيات");

    const card = screen.getByText("قائمة الأمنيات").closest("article");
    expect(within(card).getByRole("switch")).toBeDisabled();
    expect(within(card).queryByRole("button", { name: "حفظ" })).not.toBeInTheDocument();
    expect(screen.getByText("وضع القراءة فقط")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "سجل التغييرات" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إعادة تعيين الكل" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("lets internal administrators configure client visibility per setting", async () => {
    const user = userEvent.setup();
    await renderPage();
    updateClientVisibility.mockResolvedValue({
      ...wishlist,
      visibleToClientAdmins: true,
    });

    const card = screen.getByText("قائمة الأمنيات").closest("article");
    await user.click(within(card).getByRole("checkbox"));

    await waitFor(() => {
      expect(updateClientVisibility).toHaveBeenCalledWith(
        "features.wishlist.enabled",
        true,
      );
    });
  });
});
