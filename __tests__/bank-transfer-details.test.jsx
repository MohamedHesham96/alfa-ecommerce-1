import { render, screen } from "@testing-library/react";

import BankTransferDetails from "../app/user/components/BankTransferDetails";
import { AppConfigProvider } from "../context/AppConfigContext";
import { LanguageProvider } from "../context/LanguageContext";
import { resetAppConfigForTests } from "../lib/appConfigStore";

const bankConfig = {
  "payments.instapayBankAccount.accountName": "كيرلس ابراهيم عثم ملك",
  "payments.instapayBankAccount.bankName": "البنك الاهلي المصري",
  "payments.instapayBankAccount.accountNumber": "00645000894991101010",
  "payments.instapayBankAccount.iban": "EG840003006450008949911010100",
};

function renderDetails(paymentMethod) {
  return render(
    <AppConfigProvider initialConfig={bankConfig}>
      <LanguageProvider>
        <BankTransferDetails paymentMethod={paymentMethod} />
      </LanguageProvider>
    </AppConfigProvider>,
  );
}

describe("bank transfer details", () => {
  beforeEach(() => {
    resetAppConfigForTests(bankConfig);
    localStorage.clear();
  });

  it("shows the configured bank details for an InstaPay bank-account order", () => {
    renderDetails("INSTAPAY_BANK_ACCOUNT");

    expect(screen.getByText("بيانات التحويل البنكي")).toBeInTheDocument();
    expect(screen.getByText("كيرلس ابراهيم عثم ملك")).toBeInTheDocument();
    expect(screen.getByText("البنك الاهلي المصري")).toBeInTheDocument();
    expect(screen.getByText("00645000894991101010")).toBeInTheDocument();
    expect(screen.getByText("EG840003006450008949911010100")).toBeInTheDocument();
  });

  it("does not show bank details for other payment methods", () => {
    renderDetails("CASH_ON_DELIVERY");

    expect(screen.queryByText("بيانات التحويل البنكي")).not.toBeInTheDocument();
  });
});
