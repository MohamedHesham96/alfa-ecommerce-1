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
}) {
  const type =
    fulfillmentType === FULFILLMENT_TYPE.PICKUP
      ? FULFILLMENT_TYPE.PICKUP
      : FULFILLMENT_TYPE.DELIVERY;

  return {
    paymentMethod: paymentMethod?.value ?? paymentMethod,
    fulfillmentType: type,
    pickupPlaceId: type === FULFILLMENT_TYPE.PICKUP ? pickupPlaceId : null,
  };
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
