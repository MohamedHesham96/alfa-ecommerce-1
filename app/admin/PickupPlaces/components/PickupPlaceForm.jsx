"use client";

import { useState } from "react";
import { MdCancel } from "react-icons/md";
import { toast } from "react-toastify";

import { useLanguage } from "../../../../context/LanguageContext";
import { useRefresh } from "../../../../context/refreshContext";
import { postRequest, putRequest } from "../../../../utils/requestsUtils";

const EMPTY_FORM = {
  name: "",
  description: "",
  address: "",
  phone: "",
  workingHours: "",
  active: true,
};

function formFromPlace(place) {
  if (!place) return { ...EMPTY_FORM };
  return {
    name: place.name ?? "",
    description: place.description ?? "",
    address: place.address ?? "",
    phone: place.phone ?? "",
    workingHours: place.workingHours ?? "",
    active: place.active !== false,
  };
}

export default function PickupPlaceForm({ place, onClose }) {
  const { t, locale } = useLanguage();
  const { triggerRefresh } = useRefresh();
  const isArabic = locale === "ar";
  const isEdit = Boolean(place?.pickupPlaceId);

  const [form, setForm] = useState(() => formFromPlace(place));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    if (!form.name.trim()) nextErrors.name = t("field_required");
    if (!form.description.trim())
      nextErrors.description = t("field_required");
    if (!form.address.trim()) nextErrors.address = t("field_required");
    if (!form.phone.trim()) nextErrors.phone = t("field_required");
    if (!form.workingHours.trim())
      nextErrors.workingHours = t("field_required");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate() || saving) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      workingHours: form.workingHours.trim(),
      active: form.active,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await putRequest(
          `/api/admin/pickup-places/${place.pickupPlaceId}`,
          payload,
          "",
        );
      } else {
        await postRequest("/api/admin/pickup-places", payload, "", false);
        toast.success(t("pickup_place_saved"));
      }
      triggerRefresh();
      onClose();
    } catch {
      // The shared request utility surfaces the error and the form stays open.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal max-w-[720px]">
        <div className="admin-modal-header">
          <div>
            <h1 className="admin-modal-title">
              {isEdit ? t("edit_pickup_place") : t("add_pickup_place")}
            </h1>
            <p className="admin-modal-description">
              {t("pickup_places_description")}
            </p>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <MdCancel className="text-xl" />
          </button>
        </div>

        <form className="admin-modal-body space-y-4" onSubmit={submit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              {t("pickup_place_name")} *
            </label>
            <input
              type="text"
              value={form.name}
              maxLength={255}
              onChange={(event) => setField("name", event.target.value)}
              className={`admin-input ${errors.name ? "admin-input-error" : ""}`}
            />
            {errors.name ? (
              <p className="mt-1 text-xs font-semibold text-red-600">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              {t("description")} *
            </label>
            <textarea
              value={form.description}
              maxLength={2000}
              rows={3}
              onChange={(event) => setField("description", event.target.value)}
              className={`admin-textarea ${errors.description ? "admin-input-error" : ""}`}
            />
            {errors.description ? (
              <p className="mt-1 text-xs font-semibold text-red-600">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              {t("address")} *
            </label>
            <textarea
              value={form.address}
              maxLength={1000}
              rows={2}
              onChange={(event) => setField("address", event.target.value)}
              className={`admin-textarea ${errors.address ? "admin-input-error" : ""}`}
            />
            {errors.address ? (
              <p className="mt-1 text-xs font-semibold text-red-600">
                {errors.address}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                {t("phoneNumber")} *
              </label>
              <input
                type="tel"
                value={form.phone}
                maxLength={50}
                dir="ltr"
                onChange={(event) => setField("phone", event.target.value)}
                className={`admin-input ${errors.phone ? "admin-input-error" : ""}`}
              />
              {errors.phone ? (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                {t("working_hours")} *
              </label>
              <input
                type="text"
                value={form.workingHours}
                maxLength={255}
                placeholder={
                  isArabic ? "٩:٠٠ ص - ٩:٠٠ م" : "9:00 AM - 9:00 PM"
                }
                onChange={(event) =>
                  setField("workingHours", event.target.value)
                }
                className={`admin-input ${errors.workingHours ? "admin-input-error" : ""}`}
              />
              {errors.workingHours ? (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errors.workingHours}
                </p>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setField("active", event.target.checked)}
              className="h-4 w-4 accent-[#204272]"
            />
            <span className="text-sm font-semibold text-gray-700">
              {t("pickup_place_active")}
            </span>
          </label>

          <div className="admin-form-footer border-t border-[#eef1f6] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="admin-btn admin-btn-secondary"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn admin-btn-primary"
            >
              {saving ? t("Submitting") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
