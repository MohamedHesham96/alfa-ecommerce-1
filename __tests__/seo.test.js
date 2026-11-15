import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildCategoryMetadata,
  buildCollectionJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
  categoryDescription,
  categoryPath,
  categoryUrl,
  productDescription,
  productPath,
  productUrl,
  serializeJsonLd,
  validBrand,
} from "../lib/seo";

const product = {
  itemId: 5,
  seoCode: "senator-lens-two-exit",
  code: "ST221",
  nameEn: "Senator Lens Two Exit",
  nameAr: "عدسة سيناتور 2 مخرج",
  descriptionAr: "عدسة استقبال KU BAND لمخرجين.",
  descriptionEn: "KU BAND twin output LNB.",
  price: 200,
  oldPrice: 220,
  available: true,
  active: true,
  brand: "",
  images: [{ imageUrl: "/items/item-images/lens.jpg" }],
  itemCategory: {
    itemCategoryId: 16,
    nameEn: "Lenses",
    nameAr: "عدسات",
    seoCode: "lenses",
  },
};

const category = {
  itemCategoryId: 16,
  nameEn: "Lenses",
  nameAr: "عدسات",
  seoCode: "lenses",
  imageURL: "/item-categories/lenses.jpg",
};

describe("SEO URL helpers", () => {
  it("uses the canonical seoCode product URL", () => {
    expect(productPath(product)).toBe("/products/senator-lens-two-exit");
    expect(productUrl(product)).toBe(
      `${SITE_URL}/products/senator-lens-two-exit`,
    );
  });

  it("falls back to the legacy product URL only when seoCode is missing", () => {
    expect(productPath({ itemId: 7, nameEn: "Test", seoCode: null })).toBe(
      "/user/productdetails/Test/7",
    );
  });

  it("uses the canonical category URL", () => {
    expect(categoryPath(category)).toBe("/categories/lenses");
    expect(categoryUrl(category)).toBe(`${SITE_URL}/categories/lenses`);
  });
});

describe("SEO metadata", () => {
  it("builds a unique product title, canonical and OG metadata", () => {
    const metadata = buildProductMetadata(product);
    expect(metadata.title).toBe("عدسة سيناتور 2 مخرج");
    expect(metadata.alternates.canonical).toBe(
      `${SITE_URL}/products/senator-lens-two-exit`,
    );
    expect(metadata.openGraph.images[0].url).toBe(
      `${SITE_URL}/images/items/item-images/lens.jpg`,
    );
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.robots.googleBot).toMatchObject({
      index: true,
      follow: true,
      "max-image-preview": "large",
    });
  });

  it("adds the real category to very short product titles", () => {
    const metadata = buildProductMetadata({ ...product, nameAr: "بانورما" });
    expect(metadata.title).toBe("بانورما - عدسات");
  });

  it("indexes a non-empty category page and makes an empty one noindex", () => {
    const indexable = buildCategoryMetadata(category, {
      itemsCount: 4,
      topNames: ["عدسة سيناتور 2 مخرج"],
    });
    expect(indexable.alternates.canonical).toBe(
      `${SITE_URL}/categories/lenses`,
    );
    expect(indexable.robots.index).toBe(true);

    const empty = buildCategoryMetadata(category, { itemsCount: 0 });
    expect(empty.robots).toMatchObject({ index: false, follow: true });
    expect(empty.robots.googleBot.index).toBe(false);
  });

  it("gives paginated category pages self-referencing canonicals", () => {
    const metadata = buildCategoryMetadata(category, {
      itemsCount: 4,
      page: 1,
    });
    expect(metadata.alternates.canonical).toBe(
      `${SITE_URL}/categories/lenses?page=2`,
    );
    expect(metadata.title).toContain("صفحة 2");
  });

  it("builds a unique category description from real counts and names", () => {
    const text = categoryDescription(category, 4, ["عدسة A", "عدسة B"]);
    expect(text).toContain("عدسات");
    expect(text).toContain("4");
    expect(text).toContain("عدسة A");
  });

  it("falls back to a factual product description", () => {
    const text = productDescription({
      nameAr: "منتج",
      itemCategory: { nameAr: "قسم" },
    });
    expect(text).toContain("منتج");
    expect(text).toContain("ألفا جروب");
  });
});

describe("Structured data", () => {
  it("matches visible price, availability and real identifiers", () => {
    const jsonLd = buildProductJsonLd(product);
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.sku).toBe("ST221");
    expect(jsonLd.offers.price).toBe("200.00");
    expect(jsonLd.offers.priceCurrency).toBe("EGP");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
    expect(jsonLd.offers.url).toBe(
      `${SITE_URL}/products/senator-lens-two-exit`,
    );
  });

  it("never emits invented aggregate ratings or invalid brands", () => {
    const jsonLd = buildProductJsonLd({ ...product, brand: "Brand" });
    expect(jsonLd.aggregateRating).toBeUndefined();
    expect(jsonLd.review).toBeUndefined();
    expect(jsonLd.brand).toBeUndefined();
    expect(validBrand("Kyocera")).toBe("Kyocera");
    expect(validBrand("gdfgdf")).toBeNull();
  });

  it("emits aggregateRating only for real, visible ratings", () => {
    const jsonLd = buildProductJsonLd({
      ...product,
      averageRating: 4.5,
      ratingCount: 12,
    });
    expect(jsonLd.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: 12,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it("emits breadcrumb names and URLs that match navigation", () => {
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "الرئيسية", url: SITE_URL },
      { name: "عدسات", url: `${SITE_URL}/categories/lenses` },
    ]);
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[1]).toMatchObject({
      position: 2,
      name: "عدسات",
      item: `${SITE_URL}/categories/lenses`,
    });
  });

  it("builds a collection list with canonical product links", () => {
    const jsonLd = buildCollectionJsonLd(category, [product], 0);
    expect(jsonLd["@type"]).toBe("CollectionPage");
    expect(jsonLd.mainEntity.itemListElement[0]).toMatchObject({
      position: 1,
      url: `${SITE_URL}/products/senator-lens-two-exit`,
    });
  });

  it("escapes HTML-sensitive characters in JSON-LD", () => {
    const serialized = serializeJsonLd({ name: "</script><script>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script");
  });
});
