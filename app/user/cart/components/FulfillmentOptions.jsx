"use client";

import { useLanguage } from "../../../../context/LanguageContext";
import PickupPlaceSelector from "./PickupPlaceSelector";
import { FULFILLMENT_TYPE } from "./checkoutFulfillment";

export default function FulfillmentOptions({
  pickupEnabled,
  fulfillmentType,
  onChange,
  pickupPlaces = [],
  pickupPlaceId,
  onSelectPickupPlace,
  pickupLoading,
  pickupError,
  onRetry,
  signedIn,
}) {
  const { t } = useLanguage();

  if (!pickupEnabled) return null;

  const pickupSelected = fulfillmentType === FULFILLMENT_TYPE.PICKUP;

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 p-3">
      <p className="mb-2 text-sm font-semibold text-gray-700">
        {t("fulfillment_method")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={!pickupSelected}
          onClick={() => onChange(FULFILLMENT_TYPE.DELIVERY)}
          className={`rounded-xl border p-3 text-start transition ${
            !pickupSelected
              ? "border-[#CD4354] bg-[#fff5f6] ring-2 ring-[#CD4354]/20"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <span className="block text-sm font-bold text-gray-900">
            {t("home_delivery")}
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-gray-500">
            {t("delivery_text")}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={pickupSelected}
          onClick={() => onChange(FULFILLMENT_TYPE.PICKUP)}
          className={`rounded-xl border p-3 text-start transition ${
            pickupSelected
              ? "border-[#CD4354] bg-[#fff5f6] ring-2 ring-[#CD4354]/20"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <span className="block text-sm font-bold text-gray-900">
            {t("pickup")}
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-gray-500">
            {t("pickup_shipping_free")}
          </span>
        </button>
      </div>

      {pickupSelected ? (
        <PickupPlaceSelector
          places={pickupPlaces}
          selectedId={pickupPlaceId}
          onSelect={onSelectPickupPlace}
          loading={pickupLoading}
          error={pickupError}
          onRetry={onRetry}
          signedIn={signedIn}
        />
      ) : null}
    </div>
  );
}
