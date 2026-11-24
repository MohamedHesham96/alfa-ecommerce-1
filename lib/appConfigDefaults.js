/**
 * Safe frontend fallbacks for public configuration values.
 *
 * The operational System Settings are managed by the backend; the
 * frontend-facing ones are delivered through the public config API. The
 * remaining entries are frozen defaults for presentation and legacy feature
 * settings that are no longer admin-configurable; keeping them here preserves
 * the existing storefront behavior when those keys are absent from the public
 * configuration API. The backend remains authoritative for the active
 * settings.
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
  "payments.instapay.paymentLink": "",
  "payments.instapay.qrImage": "",
  "payments.instapayBankAccount.enabled": true,
  "payments.instapayBankAccount.accountName": "كيرلس ابراهيم عثم ملك",
  "payments.instapayBankAccount.bankName": "البنك الاهلي المصري",
  "payments.instapayBankAccount.accountNumber": "00645000894991101010",
  "payments.instapayBankAccount.iban": "EG840003006450008949911010100",
  "payments.creditCard.enabled": false,

  "pickup.enabled": false,

  ITEM_DIMENSIONS_ENABLED: false,

  // System Setting: ENABLE_CATEGORIES_TREE. Disabled unless the backend
  // installation explicitly enables hierarchical category navigation.
  ENABLE_CATEGORIES_TREE: false,

  // System Setting: MULTIPLE_USER_ADDRESSES. Disabled unless the backend
  // installation explicitly enables it.
  MULTIPLE_USER_ADDRESSES: false,

  "features.productReviews.enabled": true,
  "features.wishlist.enabled": true,
  "features.customerRegistration.enabled": true,
  "features.discounts.enabled": true,
  "features.orderCancellation.enabled": true,
  "features.salesReport.enabled": false,
});

export function getDefaultAppConfig(key, fallback) {
  if (Object.prototype.hasOwnProperty.call(DEFAULT_APP_CONFIG, key)) {
    return DEFAULT_APP_CONFIG[key];
  }
  return fallback;
}
