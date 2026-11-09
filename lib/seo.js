const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://alfagrouptech.com";

export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");
export const IMAGE_BASE_URL = `${SITE_URL}/images`;
export const SITE_NAME_AR = "ألفا جروب تكنولوجي";
export const SITE_NAME_EN = "Alfa Group Tech";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/Images/logo.png`;
export const CURRENCY = "EGP";

const INVALID_BRANDS = new Set([
  "brand",
  "test",
  "testing",
  "unknown",
  "n/a",
  "na",
  "none",
  "null",
  "gdfgdf",
  "dfgdf",
  "dfg",
  "asdasd",
  "asdasdasd",
  "-",
  ".",
]);

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/images/")) return absoluteUrl(imageUrl);
  return `${IMAGE_BASE_URL}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

export function productPath(product) {
  if (!product) return "/products";
  if (product.seoCode) return `/products/${encodeURIComponent(product.seoCode)}`;
  const fallbackName = encodeURIComponent(
    product.nameEn || product.nameAr || "product",
  );
  return `/user/productdetails/${fallbackName}/${product.itemId}`;
}

export function categoryPath(category) {
  if (!category) return "/products";
  if (category.seoCode) {
    return `/categories/${encodeURIComponent(category.seoCode)}`;
  }
  const fallbackName = encodeURIComponent(
    category.nameEn || category.nameAr || "category",
  );
  return `/user/products/category/${fallbackName}/${category.itemCategoryId}`;
}

export function productUrl(product) {
  return absoluteUrl(productPath(product));
}

export function categoryUrl(category) {
  return absoluteUrl(categoryPath(category));
}

export function productsIndexUrl(page = 0) {
  return page > 0 ? `/products?page=${page + 1}` : "/products";
}

export function categoryPageUrl(category, page = 0) {
  const base = categoryPath(category);
  return page > 0 ? `${base}?page=${page + 1}` : base;
}

export function plainText(value, maxLength = Infinity) {
  if (!value) return "";
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function validBrand(brand) {
  if (!brand) return null;
  const trimmed = String(brand).trim();
  if (!trimmed || trimmed.length > 70) return null;
  if (INVALID_BRANDS.has(trimmed.toLowerCase())) return null;
  if (!/[A-Za-z\u0600-\u06FF]/.test(trimmed)) return null;
  return trimmed;
}

export function productDisplayName(product, locale = "ar") {
  if (!product) return "";
  return locale === "en"
    ? product.nameEn || product.nameAr || ""
    : product.nameAr || product.nameEn || "";
}

export function productTitle(product) {
  return productDisplayName(product, "ar");
}

export function categoryTitle(category) {
  return productDisplayName(category, "ar");
}

function cleanDescription(value) {
  if (!value) return "";
  const text = plainText(value, 400);
  return /^undefined$/i.test(text) ? "" : text;
}

export function productDescription(product) {
  const name = productDisplayName(product, "ar");
  const category = productDisplayName(product?.itemCategory, "ar");
  const raw =
    cleanDescription(product?.descriptionAr) ||
    cleanDescription(product?.descriptionEn);

  // Some source products only have their name as the description. Always
  // include the product name so every page has a useful, unique description,
  // then add only factual catalogue context (category, availability).
  const includesName =
    raw && name && raw.toLowerCase().includes(name.toLowerCase());
  const uniquePart = raw && !includesName ? `${name}: ${raw}` : raw || name;
  const source = [
    uniquePart,
    category ? `قسم ${category}` : "",
    `متوفر لدى ${SITE_NAME_AR}`,
    "أسعار تنافسية ومواصفات واضحة مع شحن داخل مصر",
  ]
    .filter(Boolean)
    .join(". ");
  return plainText(`${source}.`, 158);
}

export function categoryDescription(category, itemsCount = 0, topNames = []) {
  const name = productDisplayName(category, "ar");
  const countText =
    itemsCount > 0
      ? `يضم ${itemsCount} منتجًا متاحًا`
      : "تصفح المنتجات المتوفرة في هذا القسم";
  const sample =
    topNames.length > 0
      ? `، ومن أبرزها ${topNames.slice(0, 3).join("، ")}`
      : "";
  return plainText(
    `تسوق ${name} من ${SITE_NAME_AR}. ${countText}${sample}. أسعار تنافسية ومواصفات واضحة مع شحن داخل مصر.`,
    158,
  );
}

export function productImages(product) {
  if (!product?.images) return [];
  return product.images
    .map((image) => absoluteImageUrl(image?.imageUrl || image))
    .filter(Boolean);
}

export function buildProductMetadata(product) {
  const image = productImages(product)[0] || DEFAULT_OG_IMAGE;
  const description = productDescription(product);
  const canonical = productUrl(product);
  return {
    title: productTitle(product),
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME_AR,
      title: productTitle(product),
      description,
      locale: "ar_EG",
      images: [{ url: image, alt: productDisplayName(product, "ar") }],
    },
    twitter: {
      card: "summary_large_image",
      title: productTitle(product),
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export function buildCategoryMetadata(
  category,
  { itemsCount = 0, topNames = [], page = 0 } = {},
) {
  const canonical = absoluteUrl(categoryPageUrl(category, page));
  const title =
    page > 0
      ? `${categoryTitle(category)} - صفحة ${page + 1}`
      : categoryTitle(category);  const description = categoryDescription(category, itemsCount, topNames);
  const image = absoluteImageUrl(category?.imageURL) || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME_AR,
      title,
      description,
      locale: "ar_EG",
      images: [{ url: image, alt: productDisplayName(category, "ar") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: itemsCount > 0
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export function buildProductsIndexMetadata(page = 0) {
  const canonical = absoluteUrl(productsIndexUrl(page));
  const title =
    page > 0
      ? `كل المنتجات - صفحة ${page + 1}`
      : "كل المنتجات";
  return {
    title,
    description:
      "تصفح كل منتجات ألفا جروب تكنولوجي: أجهزة استقبال، شاشات، كابلات، أجهزة منزلية وإلكترونيات بأسعار تنافسية.",
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME_AR,
      title,
      description:
        "تصفح كل منتجات ألفا جروب تكنولوجي بأسعار تنافسية ومواصفات واضحة.",
      locale: "ar_EG",
      images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME_AR }],
    },
  };
}

export function buildProductJsonLd(product) {
  const images = productImages(product);
  const brand = validBrand(product?.brand);
  const offer = {
    "@type": "Offer",
    url: productUrl(product),
    priceCurrency: CURRENCY,
  };
  if (product?.price != null) offer.price = Number(product.price).toFixed(2);
  if (product?.available != null) {
    offer.availability = product.available
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productDisplayName(product, "ar"),
    description: plainText(
      product?.descriptionAr || product?.descriptionEn || productDescription(product),
      5000,
    ),
    image: images.length > 0 ? images : [DEFAULT_OG_IMAGE],
    sku: product?.code || undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    category: productDisplayName(product?.itemCategory, "ar") || undefined,
    offers: product?.price != null ? offer : undefined,
  };
}

export function buildBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME_EN,
    alternateName: SITE_NAME_AR,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
  };
}

export function buildWebsiteJsonLd() {
  // The storefront search is client-side and noindex. A SearchAction would
  // make Google crawl the literal /user/search/{search_term_string}
  // placeholder, which then shows up as "Excluded by 'noindex' tag" in
  // Search Console even though the exclusion itself is intentional.
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME_AR,
    alternateName: SITE_NAME_EN,
    url: SITE_URL,
    inLanguage: "ar",
  };
}

export function buildCollectionJsonLd(category, products = [], page = 0) {
  const url = absoluteUrl(categoryPageUrl(category, page));
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: productDisplayName(category, "ar"),
    url,
    inLanguage: "ar",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: page * 40 + index + 1,
        url: productUrl(product),
        name: productDisplayName(product, "ar"),
      })),
    },
  };
}

export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function productBreadcrumbs(product) {
  const category = product?.itemCategory;
  return [
    { name: "الرئيسية", url: SITE_URL },
    {
      name: productDisplayName(category, "ar") || "المنتجات",
      url: category ? categoryUrl(category) : `${SITE_URL}/products`,
    },
    { name: productDisplayName(product, "ar"), url: productUrl(product) },
  ];
}

export function categoryBreadcrumbs(category, page = 0) {
  return [
    { name: "الرئيسية", url: SITE_URL },
    { name: "كل المنتجات", url: `${SITE_URL}/products` },
    {
      name: productDisplayName(category, "ar"),
      url: absoluteUrl(categoryPageUrl(category, page)),
    },
  ];
}
