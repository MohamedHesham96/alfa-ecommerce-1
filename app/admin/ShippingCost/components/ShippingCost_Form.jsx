"use client";
import { useState } from "react";

import { useLanguage } from "../../../../context/LanguageContext";
import { putRequest } from "../../../../utils/requestsUtils";
import { useRefresh } from "../../../../context/refreshContext";
import AdminModal from "../../components/ui/AdminModal";
import FormField from "../../components/ui/FormField";

export default function ShippingCostForm({
  govName,
  govId,
  govPrice,
  setShowForm,
}) {
  const [shippingCost, setShippingCost] = useState(0);
  const { triggerRefresh } = useRefresh();
  const { t } = useLanguage();

  const saveShippingCost = async () => {
    try {
      await putRequest(
        `/api/admin/shipping-rates/${govId}`,
        {
          shippingCost: Number(shippingCost),
        },
        t("message"),
      );
      triggerRefresh();
      setShowForm(false);
    } catch (err) {
    }
  };

  return (
    <AdminModal
      open
      onClose={() => setShowForm(false)}
      title={t("EditShippingCost")}
      description={t("shipping_description")}
      size="sm"
      closeLabel={t("close")}
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowForm(false)}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={saveShippingCost}
          >
            {t("save")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
            {t("governorate")}
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--admin-ink)]">{govName}</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {Number(govPrice ?? 0).toLocaleString("en-US")} {t("currency")}
          </p>
        </div>
        <FormField
          label={t("changeShippingCost")}
          htmlFor="shippingCost"
          required
        >
          <div className="relative">
            <input
              id="shippingCost"
              name="shippingCost"
              type="number"
              className="admin-input pe-16"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              min="0"
              step="0.01"
            />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-semibold text-[var(--admin-muted)]">
              {t("currency")}
            </span>
          </div>
        </FormField>
      </div>
    </AdminModal>
  );
}
