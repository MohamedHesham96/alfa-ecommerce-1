"use client";

import { LuLoader } from "react-icons/lu";

import { useLanguage } from "../../../../context/LanguageContext";

export default function PickupPlaceSelector({
  places = [],
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  signedIn = true,
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
        <LuLoader className="animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm font-semibold text-red-700">
          {t("pickup_places_error")}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            {t("retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (!signedIn) {
    return (
      <p className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        {t("sign_in_to_select_pickup")}
      </p>
    );
  }

  if (!places.length) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-600">
        {t("pickup_places_empty")}
      </p>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("select_pickup_place")}
      className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pe-1"
    >
      {places.map((place) => {
        const selected = String(selectedId) === String(place.pickupPlaceId);
        return (
          <label
            key={place.pickupPlaceId}
            data-testid={`pickup-place-${place.pickupPlaceId}`}
            className={`block cursor-pointer rounded-2xl border p-4 transition ${
              selected
                ? "border-[#CD4354] bg-[#fff5f6] ring-2 ring-[#CD4354]/20"
                : "border-gray-200 bg-white hover:border-[#CD4354]/50 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="pickup-place"
                value={place.pickupPlaceId}
                checked={selected}
                onChange={() => onSelect(place)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#CD4354]"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-gray-900">
                  {place.name}
                </h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  {place.description}
                </p>

                <dl className="mt-3 space-y-1.5 text-xs text-gray-700">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold">{t("address")}:</dt>
                    <dd className="break-words">{place.address}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold">
                      {t("phoneNumber")}:
                    </dt>
                    <dd dir="ltr">{place.phone}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold">
                      {t("working_hours")}:
                    </dt>
                    <dd>{place.workingHours}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
