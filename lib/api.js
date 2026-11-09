const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8787"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    next: { revalidate: 300 },
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`SEO API request failed (${response.status}) for ${path}`);
  }
  const json = await response.json();
  return json?.data ?? json;
}

export function getProductBySlug(slug) {
  if (!slug) return Promise.resolve(null);
  return request(`/api/public/items/slug/${encodeURIComponent(slug)}`);
}

export function getProductById(id) {
  if (!id || !/^\d+$/.test(String(id))) return Promise.resolve(null);
  return request(`/api/public/items/${encodeURIComponent(id)}`);
}

export function getCategoryBySlug(slug) {
  if (!slug) return Promise.resolve(null);
  return request(`/api/public/itemCategory/slug/${encodeURIComponent(slug)}`);
}

export function getCategoryById(id) {
  if (!id || !/^\d+$/.test(String(id))) return Promise.resolve(null);
  return request(`/api/public/itemCategory/${encodeURIComponent(id)}`);
}

export async function getAllCategories() {
  return (await request("/api/public/itemCategory/all")) || [];
}

export async function getSliderImages() {
  return (await request("/api/public/sliderImages")) || [];
}

export async function getOffers() {
  return (await request("/api/public/offers")) || [];
}

export async function getContact() {
  return (await request("/api/public/contact")) || null;
}

/**
 * Server-side public configuration. Uses a short Next.js data-cache window so
 * administrative changes become visible without a redeploy, while repeated
 * page renders do not hit the backend on every request.
 */
export async function getPublicConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/config`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return { values: {}, version: 0 };
    }
    const json = await response.json();
    const data = json?.data ?? json;
    return {
      values: data?.values && typeof data.values === "object" ? data.values : {},
      version: Number(data?.version) || 0,
    };
  } catch {
    // A configuration outage must not break the storefront. The provider
    // applies the same safe defaults that are registered in the backend.
    return { values: {}, version: 0 };
  }
}

export function searchProducts({
  page = 0,
  size = 40,
  categoryId = null,
  sortBy = null,
  ascending = true,
} = {}) {
  const body = { page, size };
  if (categoryId != null) body.categoryId = categoryId;
  if (sortBy) {
    body.sortBy = sortBy;
    body.ascending = ascending;
  }
  return request("/api/public/items/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getSeoRedirect(type, slug) {
  if (!slug) return Promise.resolve(null);
  const path = type === "category" ? "category" : "item";
  return request(
    `/api/public/seo/redirects/${path}/${encodeURIComponent(slug)}`,
  );
}

export async function getSeoSitemap() {
  try {
    return (
      (await request("/api/public/seo/sitemap")) || {
        products: [],
        categories: [],
      }
    );
  } catch {
    // Sitemap generation must not fail the build when the API is temporarily
    // unavailable; the next revalidation will pick up the full catalogue.
    return { products: [], categories: [] };
  }
}

export async function getRecentProducts() {
  return (await request("/api/public/items/recent")) || [];
}

export function getProductFeedUrl() {
  return `${API_BASE_URL}/api/public/seo/product-feed.xml`;
}

/**
 * Spring's Page JSON nests pagination under `page`:
 * { content: [...], page: { number, size, totalElements, totalPages } }
 * The frontend historically also accepted a flat shape, so normalise both.
 */
export function normalizePagePayload(payload, fallbackSize = 40) {
  const data = payload?.data ?? payload ?? {};
  const page = data?.page ?? data ?? {};
  const content = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : [];
  const size = Number(page?.size ?? data?.size ?? fallbackSize) || fallbackSize;
  const totalElements =
    Number(
      page?.totalElements ??
        data?.totalElements ??
        page?.totalItems ??
        data?.totalItems ??
        page?.totalCount ??
        data?.totalCount ??
        0,
    ) || 0;
  const totalPages =
    Number(
      page?.totalPages ??
        data?.totalPages ??
        page?.totalPage ??
        data?.totalPage ??
        0,
    ) || (content.length > 0 ? Math.max(1, Math.ceil(totalElements / size)) : 0);
  const number =
    Number(
      page?.number ??
        data?.number ??
        page?.pageNumber ??
        data?.pageNumber ??
        0,
    ) || 0;
  return { content, number, size, totalElements, totalPages };
}

export { API_BASE_URL };
