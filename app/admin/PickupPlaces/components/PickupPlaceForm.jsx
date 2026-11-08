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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6">
      <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {isEdit ? t("edit_pickup_place") : t("add_pickup_place")}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {t("pickup_places_description")}
            </p>
          </div>
          <button
            type="button"
            className="text-3xl text-red-950 hover:text-red-700"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <MdCancel />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={submit} noValidate>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              {t("pickup_place_name")} *
            </label>
            <input
              type="text"
              value={form.name}
              maxLength={255}
              onChange={(event) => setField("name", event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#204272]/20 ${
                errors.name ? "border-red-400" : "border-gray-300"
              }`}
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
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#204272]/20 ${
                errors.description ? "border-red-400" : "border-gray-300"
              }`}
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
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#204272]/20 ${
                errors.address ? "border-red-400" : "border-gray-300"
              }`}
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
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#204272]/20 ${
                  errors.phone ? "border-red-400" : "border-gray-300"
                }`}
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
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#204272]/20 ${
                  errors.workingHours ? "border-red-400" : "border-gray-300"
                }`}
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

          <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#204272] px-5 py-2 text-sm font-semibold text-white hover:bg-[#19345a] disabled:opacity-50"
            >
              {saving ? t("Submitting") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
