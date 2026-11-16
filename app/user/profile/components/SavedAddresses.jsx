"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IoLocationSharp } from "react-icons/io5";
import { LuLoader } from "react-icons/lu";
import Select from "react-select";
import { toast } from "react-toastify";

import { useLanguage } from "../../../../context/LanguageContext";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../../../utils/requestsUtils";

const EMPTY_FORM = {
  label: "",
  address: "",
  governorateId: "",
  defaultAddress: false,
};

export default function SavedAddresses({ onChanged }) {
  const { t, locale } = useLanguage();
  const [addresses, setAddresses] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await getRequest("/api/users/addresses");
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch {
      setAddresses([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    let active = true;
    getRequest("/api/public/governorates")
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response.data) ? response.data : [];
        setGovernorates(
          list.map((governorate) => ({
            value: governorate.governorateId,
            label:
              locale === "ar"
                ? governorate.nameAr
                : governorate.nameEn,
          })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [locale]);

  const selectedGovernorate = useMemo(
    () =>
      governorates.find(
        (option) => String(option.value) === String(form.governorateId),
      ) || null,
    [governorates, form.governorateId],
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, defaultAddress: addresses.length === 0 });
    setIsFormOpen(true);
  };

  const openEdit = (address) => {
    setEditingId(address.userAddressId);
    setForm({
      label: address.label || "",
      address: address.address || "",
      governorateId:
        address.governorateId ?? address.governorate?.governorateId ?? "",
      defaultAddress: Boolean(address.defaultAddress),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(false);
  };

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.address.trim() || !form.governorateId) {
      toast.error(t("field_required"));
      return;
    }

    const payload = {
      label: form.label.trim() || null,
      address: form.address.trim(),
      governorateId: Number(form.governorateId),
      defaultAddress: Boolean(form.defaultAddress),
    };

    setSaving(true);
    try {
      if (editingId) {
        await putRequest(`/api/users/addresses/${editingId}`, payload, "");
      } else {
        await postRequest("/api/users/addresses", payload, "", true);
      }
      closeForm();
      await loadAddresses();
      onChanged?.();
    } catch {
      // The shared request utility displays backend validation errors.
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await putRequest(`/api/users/addresses/${addressId}/default`, {}, "");
      await loadAddresses();
      onChanged?.();
    } catch {
      // Error toast is handled by the shared request utility.
    }
  };

  const handleDelete = async (addressId) => {
    try {
      const result = await deleteRequest(
        `/api/users/addresses/${addressId}`,
        t("confirm_delete_address"),
      );
      if (result !== undefined) {
        await loadAddresses();
        onChanged?.();
      }
    } catch {
      // Error toast is handled by the shared request utility.
    }
  };

  const governorateName = (address) =>
    locale === "ar"
      ? address.governorate?.nameAr
      : address.governorate?.nameEn;

  return (
    <div className="w-full bg-white rounded-3xl mb-10">
      <div className="flex flex-wrap items-start justify-between gap-3 p-7">
        <div className="min-w-0">
          <p className="font-semibold">{t("savedAddresses")}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {t("manageAddresses")}
          </p>
        </div>
        {!isFormOpen ? (
          <button
            type="button"
            onClick={openAdd}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            {t("addAddress")}
          </button>
        ) : null}
      </div>
      <hr />

      <div className="p-7">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
            <LuLoader className="animate-spin" />
            {t("loading_addresses")}
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm font-semibold text-red-700">
              {t("addresses_load_error")}
            </p>
            <button
              type="button"
              onClick={loadAddresses}
              className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              {t("retry")}
            </button>
          </div>
        ) : addresses.length === 0 && !isFormOpen ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
            {t("noSavedAddresses")}
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <article
                key={address.userAddressId}
                className={`rounded-2xl border p-4 ${
                  address.defaultAddress
                    ? "border-red-200 bg-red-50/40"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 rounded-full bg-gray-100 p-2 text-gray-600">
                      <IoLocationSharp />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">
                          {address.label || t("address")}
                        </h3>
                        {address.defaultAddress ? (
                          <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                            {t("defaultAddress")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 break-words text-sm text-gray-700">
                        {address.address}
                      </p>
                      {governorateName(address) ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {governorateName(address)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!address.defaultAddress ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address.userAddressId)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        {t("setAsDefault")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.userAddressId)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {isFormOpen ? (
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
          >
            <p className="mb-4 text-sm font-bold text-gray-900">
              {editingId ? t("editAddress") : t("addNewAddress")}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500">
                  {t("addressLabel")}{" "}
                  <span className="font-normal">
                    ({t("addressLabelOptional")})
                  </span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  maxLength={100}
                  placeholder={t("addressLabelPlaceholder")}
                  onChange={(event) => setField("label", event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-red-400"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500">
                  {t("governorate")}
                </label>
                <div className="rounded-lg border border-gray-300 bg-white">
                  <Select
                    options={governorates}
                    value={selectedGovernorate}
                    onChange={(option) =>
                      setField("governorateId", option?.value ?? "")
                    }
                    isSearchable={false}
                    placeholder=""
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        border: "none",
                        boxShadow: "none",
                        background: "transparent",
                        minHeight: "40px",
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#dc2626"
                          : state.isFocused
                            ? "#fee2e2"
                            : "#ffffff",
                        color: state.isSelected ? "#ffffff" : "#374151",
                        cursor: "pointer",
                      }),
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500">
                  {t("address")}
                </label>
                <input
                  type="text"
                  value={form.address}
                  maxLength={500}
                  onChange={(event) => setField("address", event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white p-2 text-sm outline-none focus:border-red-400"
                />
              </div>
            </div>

            <label className="mt-4 flex w-fit items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={form.defaultAddress}
                onChange={(event) =>
                  setField("defaultAddress", event.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 accent-red-600"
              />
              {t("setAsDefault")}
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? t("saveChanges") : t("save")}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
