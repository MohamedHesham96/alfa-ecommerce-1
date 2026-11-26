"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { useLanguage } from "../../../../context/LanguageContext";
import { useRefresh } from "../../../../context/refreshContext";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../../../utils/requestsUtils";
import AdminModal from "../../components/ui/AdminModal";
import FormField from "../../components/ui/FormField";

const EMPTY_FORM = {
  governorateId: "",
  nameAr: "",
  nameEn: "",
  shippingCost: "",
};

function formFromArea(area) {
  if (!area) return { ...EMPTY_FORM };
  return {
    governorateId: String(
      area.governorate?.governorateId ?? area.governorateId ?? "",
    ),
    nameAr: area.nameAr ?? "",
    nameEn: area.nameEn ?? "",
    shippingCost:
      area.shippingCost === null || area.shippingCost === undefined
        ? ""
        : String(area.shippingCost),
  };
}

export default function AreaForm({ area, onClose }) {
  const { t, locale } = useLanguage();
  const { triggerRefresh } = useRefresh();
  const isEdit = Boolean(area?.areaId);

  const [form, setForm] = useState(() => formFromArea(area));
  const [governorates, setGovernorates] = useState([]);
  const [governoratesLoading, setGovernoratesLoading] = useState(!isEdit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setGovernoratesLoading(true);
    getRequest("/api/public/governorates")
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response?.data) ? response.data : [];
        setGovernorates(
          list.map((governorate) => ({
            value: String(governorate.governorateId),
            label:
              locale === "ar"
                ? governorate.nameAr
                : governorate.nameEn,
          })),
        );
      })
      .catch(() => {
        if (active) setGovernorates([]);
      })
      .finally(() => {
        if (active) setGovernoratesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.governorateId) nextErrors.governorateId = t("field_required");
    if (!form.nameAr.trim()) nextErrors.nameAr = t("field_required");
    if (!form.nameEn.trim()) nextErrors.nameEn = t("field_required");
    const feeText = String(form.shippingCost ?? "").trim();
    if (feeText === "") {
      nextErrors.shippingCost = t("field_required");
    } else if (!/^\d+(\.\d{1,2})?$/.test(feeText)) {
      nextErrors.shippingCost = t("shipping_cost_invalid");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate() || saving) return;

    const payload = {
      governorateId: Number(form.governorateId),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      shippingCost: Number(form.shippingCost),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await putRequest(`/api/admin/areas/${area.areaId}`, payload, "", {
          suppressSuccessToast: true,
        });
      } else {
        await postRequest("/api/admin/areas", payload, "", false);
      }
      toast.success(t("area_saved"));
      triggerRefresh();
      onClose();
    } catch {
      // The shared request utility surfaces the backend validation message.
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      title={isEdit ? t("edit_area") : t("add_area")}
      description={t("areas_description")}
      size="md"
      closeLabel={t("close")}
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="area-form"
            className="admin-btn admin-btn-primary"
            disabled={saving}
          >
            {saving ? t("Submitting") : t("save")}
          </button>
        </>
      }
    >
      <form id="area-form" className="space-y-4" onSubmit={submit} noValidate>
        <FormField
          label={t("governorate")}
          htmlFor="area-governorate"
          required
          error={errors.governorateId}
          hint={isEdit ? t("area_governorate_immutable") : undefined}
        >
          <select
            id="area-governorate"
            className="admin-select"
            value={form.governorateId}
            onChange={(event) =>
              setField("governorateId", event.target.value)
            }
            disabled={isEdit || governoratesLoading}
            required
          >
            <option value="">
              {governoratesLoading
                ? t("loading")
                : t("selectGovernorate")}
            </option>
            {governorates.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("area_name_ar")}
            htmlFor="area-name-ar"
            required
            error={errors.nameAr}
          >
            <input
              id="area-name-ar"
              type="text"
              className="admin-input"
              value={form.nameAr}
              maxLength={255}
              onChange={(event) => setField("nameAr", event.target.value)}
              required
            />
          </FormField>

          <FormField
            label={t("area_name_en")}
            htmlFor="area-name-en"
            required
            error={errors.nameEn}
          >
            <input
              id="area-name-en"
              type="text"
              className="admin-input"
              value={form.nameEn}
              maxLength={255}
              onChange={(event) => setField("nameEn", event.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField
          label={t("shipping_fee")}
          htmlFor="area-shipping-cost"
          required
          error={errors.shippingCost}
          hint={t("shipping_fee_hint")}
        >
          <div className="relative">
            <input
              id="area-shipping-cost"
              type="number"
              className="admin-input pe-16"
              value={form.shippingCost}
              min="0"
              step="0.01"
              onChange={(event) =>
                setField("shippingCost", event.target.value)
              }
              required
            />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs font-semibold text-[var(--admin-muted)]">
              {t("currency")}
            </span>
          </div>
        </FormField>
      </form>
    </AdminModal>
  );
}
