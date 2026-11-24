import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

import InstapayPaymentCard from "../app/user/components/InstapayPaymentCard";
import { AppConfigProvider } from "../context/AppConfigContext";
import { LanguageProvider } from "../context/LanguageContext";
import { resetAppConfigForTests } from "../lib/appConfigStore";

const instapayConfig = {
  "payments.instapay.paymentLink": "https://instapay.example/pay/123",
  "instapay.qr": "/images/system-settings/instapay-qr.png",
};

function renderCard(props = {}) {
  return render(
    <AppConfigProvider initialConfig={instapayConfig}>
      <LanguageProvider>
        <InstapayPaymentCard
          paymentMethod="INSTAPAY"
          orderState="PENDING"
          {...props}
        />
      </LanguageProvider>
    </AppConfigProvider>,
  );
}

describe("InstaPay payment card", () => {
  beforeEach(() => {
    resetAppConfigForTests(instapayConfig);
    localStorage.clear();
  });

  it("shows the configured payment link and opens the QR dialog", async () => {
    const user = userEvent.setup();
    renderCard();

    expect(screen.getByText("ادفع عبر إنستاباي")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /فتح لينك الدفع/ });
    expect(link).toHaveAttribute("href", "https://instapay.example/pay/123");
    expect(link).toHaveAttribute("target", "_blank");

    await user.click(screen.getByRole("button", { name: /عرض QR الدفع/ }));

    const dialog = screen.getByRole("dialog");
    const qr = within(dialog).getByAltText("امسح كود QR للدفع");
    expect(qr.getAttribute("src")).toContain(
      "/images/system-settings/instapay-qr.png",
    );
  });

  it("does not render for other payment methods or cancelled orders", () => {
    const { rerender } = render(
      <AppConfigProvider initialConfig={instapayConfig}>
        <LanguageProvider>
          <InstapayPaymentCard paymentMethod="CASH_ON_DELIVERY" />
        </LanguageProvider>
      </AppConfigProvider>,
    );
    expect(screen.queryByText("ادفع عبر إنستاباي")).not.toBeInTheDocument();

    rerender(
      <AppConfigProvider initialConfig={instapayConfig}>
        <LanguageProvider>
          <InstapayPaymentCard paymentMethod="INSTAPAY" orderState="CANCELLED" />
        </LanguageProvider>
      </AppConfigProvider>,
    );
    expect(screen.queryByText("ادفع عبر إنستاباي")).not.toBeInTheDocument();
  });

  it("stays hidden when no link or QR image is configured", () => {
    render(
      <AppConfigProvider
        initialConfig={{
          "payments.instapay.paymentLink": "",
          "instapay.qr": "",
        }}
      >
        <LanguageProvider>
          <InstapayPaymentCard paymentMethod="INSTAPAY" orderState="PENDING" />
        </LanguageProvider>
      </AppConfigProvider>,
    );

    expect(screen.queryByText("ادفع عبر إنستاباي")).not.toBeInTheDocument();
  });
});
