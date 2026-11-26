"use client";

import { LuLoader } from "react-icons/lu";
import Select from "react-select";

import { useLanguage } from "../../../context/LanguageContext";
import {
  shouldShowAreaSelector,
  toAreaOptions,
} from "./deliveryAreas";

/**
 * Dropdown used by the customer address form and checkout.
 *
 * It renders nothing when the selected governorate has no configured areas.
 * When areas exist, the selection is mandatory (the parent enforces submit /
 * checkout state and the backend validates it again).
 */
export default function DeliveryAreaSelect({
  areas = [],
  value = null,
  onChange,
  loading = false,
  error = false,
  onRetry,
  disabled = false,
  required = true,
  id = "delivery-area",
}) {
  const { t, locale } = useLanguage();
  const options = toAreaOptions(areas, locale);
  const selected =
    options.find((option) => String(option.value) === String(value)) ?? null;

  if (loading && !shouldShowAreaSelector(areas)) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-500">
          {t("area")} {required ? "*" : null}
        </span>
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-xs text-gray-500">
          <LuLoader className="animate-spin" />
          {t("loading_areas")}
        </div>
      </div>
    );
  }

  if (error && !shouldShowAreaSelector(areas)) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-500">
          {t("area")} {required ? "*" : null}
        </span>
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
          <p className="text-xs font-semibold text-red-700">
            {t("areas_load_error")}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 rounded-md border border-red-300 bg-white px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
            >
              {t("retry")}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!shouldShowAreaSelector(areas)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-gray-500"
      >
        {t("area")} {required ? "*" : null}
      </label>
      <div className="rounded-lg border border-gray-300 bg-white">
        <Select
          inputId={id}
          aria-label={t("selectArea")}
          options={options}
          value={selected}
          onChange={(option) => onChange(option?.value ?? null)}
          isSearchable
          isDisabled={disabled}
          placeholder={t("selectArea")}
          noOptionsMessage={() => t("no_areas")}
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
  );
}
