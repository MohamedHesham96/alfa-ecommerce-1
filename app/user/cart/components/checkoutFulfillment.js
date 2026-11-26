export const FULFILLMENT_TYPE = Object.freeze({
  DELIVERY: "DELIVERY",
  PICKUP: "PICKUP",
});

/**
 * Builds the checkout request body. Delivery remains the default so existing
 * behavior is preserved when pickup is disabled.
 */
export function buildOrderPayload({
  paymentMethod,
  fulfillmentType,
  pickupPlaceId,
  addressId,
}) {
  const type =
    fulfillmentType === FULFILLMENT_TYPE.PICKUP
      ? FULFILLMENT_TYPE.PICKUP
      : FULFILLMENT_TYPE.DELIVERY;

  const payload = {
    paymentMethod: paymentMethod?.value ?? paymentMethod,
    fulfillmentType: type,
    pickupPlaceId: type === FULFILLMENT_TYPE.PICKUP ? pickupPlaceId : null,
  };

  // Only include the saved-address selection for delivery when the feature is
  // active. Omitting the key entirely keeps the historical request shape when
  // MULTIPLE_USER_ADDRESSES is disabled.
  if (type === FULFILLMENT_TYPE.DELIVERY && addressId != null) {
    payload.addressId = addressId;
  }

  // The delivery area is intentionally not part of the order payload. It is
  // fixed by the saved address/profile and can only be changed there.
  return payload;
}

/**
 * Keeps the existing order-summary math and removes the delivery fee for
 * pickup orders only. `total` is already the sum of the discounted line
 * totals, so `totalDiscount` must not be subtracted from it again.
 */
export function calculateCheckoutTotals({
  total,
  shippingCost,
  netTotal,
  fulfillmentType,
}) {
  const grossShipping = Number(shippingCost || 0);
  const effectiveShipping =
    fulfillmentType === FULFILLMENT_TYPE.PICKUP ? 0 : grossShipping;
  const fallbackNet = Number(total || 0) + grossShipping;
  const currentNet =
    netTotal === null || netTotal === undefined || netTotal === ""
      ? fallbackNet
      : Number(netTotal);

  return {
    subtotal: Number(total || 0),
    shippingCost: effectiveShipping,
    netTotal: currentNet - grossShipping + effectiveShipping,
  };
}

export function isPickupSelectionMissing({
  pickupEnabled,
  fulfillmentType,
  pickupPlaceId,
}) {
  return (
    Boolean(pickupEnabled) &&
    fulfillmentType === FULFILLMENT_TYPE.PICKUP &&
    !pickupPlaceId
  );
}

/**
 * When the feature is enabled and the customer has saved addresses, delivery
 * must use an explicit selection. If the list is empty the existing legacy
 * single-address fallback remains available.
 */
export function isDeliveryAddressSelectionMissing({
  multipleAddressesEnabled,
  fulfillmentType,
  addresses = [],
  addressId,
}) {
  return (
    Boolean(multipleAddressesEnabled) &&
    fulfillmentType !== FULFILLMENT_TYPE.PICKUP &&
    addresses.length > 0 &&
    !addressId
  );
}
