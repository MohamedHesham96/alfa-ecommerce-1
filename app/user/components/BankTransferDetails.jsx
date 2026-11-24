"use client";

import { useAppConfig } from "../../../context/AppConfigContext";
import { useLanguage } from "../../../context/LanguageContext";

const BANK_ACCOUNT_PREFIX = "payments.instapayBankAccount";

export default function BankTransferDetails({ paymentMethod, className = "" }) {
  const { t } = useLanguage();
  const method =
    paymentMethod && typeof paymentMethod === "object"
      ? paymentMethod.value
      : paymentMethod;
  const accountName = useAppConfig(`${BANK_ACCOUNT_PREFIX}.accountName`, "");
  const bankName = useAppConfig(`${BANK_ACCOUNT_PREFIX}.bankName`, "");
  const accountNumber = useAppConfig(
    `${BANK_ACCOUNT_PREFIX}.accountNumber`,
    "",
  );
  const iban = useAppConfig(`${BANK_ACCOUNT_PREFIX}.iban`, "");

  if (method !== "INSTAPAY_BANK_ACCOUNT") return null;

  const details = [
    { label: t("bank_account_name"), value: accountName },
    { label: t("bank_name"), value: bankName },
    { label: t("bank_account_number"), value: accountNumber },
    { label: t("bank_iban"), value: iban },
  ].filter((detail) => String(detail.value ?? "").trim() !== "");

  if (!details.length) return null;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-gray-50 p-4 ${className}`}
    >
      <p className="mb-3 text-sm font-bold text-gray-700">
        {t("bank_transfer_details")}
      </p>
      <dl className="space-y-2 text-xs">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-start justify-between gap-3"
          >
            <dt className="text-gray-500">{detail.label}</dt>
            <dd className="break-all text-end font-semibold text-gray-700">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
