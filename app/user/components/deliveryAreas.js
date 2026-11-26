/**
 * Pure helpers for the optional governorate/area selection.
 *
 * The area dropdown is only ever visible when the selected governorate has at
 * least one configured area. Keeping this logic in one place makes the same
 * rule apply to the profile address form, saved addresses, and checkout.
 */

export function areaDisplayName(area, locale) {
  if (!area) return "";
  const localized = locale === "ar" ? area.nameAr : area.nameEn;
  return localized || area.nameEn || area.nameAr || "";
}

export function toAreaOptions(areas, locale) {
  if (!Array.isArray(areas)) return [];
  return areas.map((area) => ({
    value: area.areaId,
    label: areaDisplayName(area, locale),
    shippingCost: Number(area.shippingCost ?? 0),
  }));
}

export function shouldShowAreaSelector(areas) {
  return Array.isArray(areas) && areas.length > 0;
}

export function isAreaSelectionMissing(areas, areaId) {
  return shouldShowAreaSelector(areas) && (areaId === null || areaId === undefined || areaId === "");
}

export function findAreaById(areas, areaId) {
  if (!Array.isArray(areas) || areaId === null || areaId === undefined) {
    return null;
  }
  return (
    areas.find((area) => String(area.areaId) === String(areaId)) || null
  );
}

/**
 * Returns the area id that should stay selected after the governorate (and
 * therefore the area list) changed. An id from the previous governorate is
 * always discarded.
 */
export function resolveAreaIdForAreas(areas, preferredAreaId) {
  return findAreaById(areas, preferredAreaId)?.areaId ?? null;
}

/**
 * Shipping fee for a delivery selection. When the governorate has areas, the
 * selected area's fee is used. Otherwise the existing governorate-based fee is
 * preserved.
 */
export function resolveAreaShippingCost(areas, areaId, fallbackShippingCost) {
  if (!shouldShowAreaSelector(areas)) {
    return Number(fallbackShippingCost ?? 0);
  }
  const area = findAreaById(areas, areaId);
  return area ? Number(area.shippingCost ?? 0) : null;
}
