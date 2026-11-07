/**
 * Safe frontend fallbacks for public configuration values.
 *
 * These mirror the developer-defined defaults registered in the backend
 * (`CoreConfigurationDefinitions`). They are used only when the configuration
 * API is unavailable during the very first render. The backend remains the
 * authoritative source for every value.
 */
export const DEFAULT_APP_CONFIG = Object.freeze({
  "branding.showPoweredBy": true,

  "catalog.showSku": true,
  "catalog.showStockStatus": true,
  "catalog.productsPerPage": 12,
  "catalog.gridColumns": 4,

  "product.gallery.layout": "THUMBNAILS_SIDE",
  "product.showSpecifications": true,

  "homepage.sections.hero.enabled": true,
  "homepage.sections.siteFeatures.enabled": true,
  "homepage.sections.featuredProducts.enabled": true,
  "homepage.sections.topDiscounted.enabled": true,
  "homepage.sections.top10.enabled": true,
  "homepage.sections.promoBanner.enabled": true,
  "homepage.sections.recommended.enabled": true,
  "homepage.sections.reviews.enabled": true,
  "homepage.sections.recentlyViewed.enabled": true,
  "homepage.sections.newProducts.enabled": true,

  "payments.cashOnDelivery.enabled": true,
  "payments.instapay.enabled": true,
  "payments.creditCard.enabled": false,

  "features.productReviews.enabled": true,
  "features.wishlist.enabled": true,
  "features.customerRegistration.enabled": true,
  "features.discounts.enabled": true,
  "features.orderCancellation.enabled": true,
});

export function getDefaultAppConfig(key, fallback) {
  if (Object.prototype.hasOwnProperty.call(DEFAULT_APP_CONFIG, key)) {
    return DEFAULT_APP_CONFIG[key];
  }
  return fallback;
}
