import { getRequest, postRequest } from "../utils/requestsUtils";

export const getCategories = async () => {
  const response = await postRequest(
    "/api/public/itemCategory/search",
    {
      page: 0,
      size: 10,
    },
    ""
  );
  return await response;
};

/**
 * Full category list. While ENABLE_CATEGORIES_TREE is enabled the backend
 * returns root categories with nested `children`, otherwise it returns the
 * existing flat list. Callers can use the shared categoryTree helpers for both
 * shapes without hardcoding the setting.
 */
export const getCategoryTree = async () => {
  const response = await getRequest("/api/public/itemCategory/all");
  const data = response?.data;
  if (Array.isArray(data)) return data;
  return data?.content || [];
};
export const getSliderImage = async () => {
  const response = await getRequest("/api/public/sliderImages");
  return await response.data;
};
export const getFeatuerProducts = async (size) => {
  const response = await postRequest(
    "/api/public/items/search",
    {
      page: 0,
      size: size,
      isFavorite: true,
    },
    ""
  );
  return await response;
};

export const getProductDetails = async (productId) => {
  const response = await getRequest(`/api/public/items/${productId}`);
  return await response;
};

// Homepage "top appliances" card. The public top-rated endpoint only returns
// in-stock products, so a category with a few available products leaves the
// card's fixed grid mostly empty. Start from that ranking and fill the missing
// rows with the category's remaining active products. Out-of-stock rows are
// marked in the UI.
export const getTopApplianceProducts = async (categoryId, size) => {
  const [rankedResult, categoryResult] = await Promise.allSettled([
    getRequest(`/api/public/items/topRated/category/${categoryId}?page=0&size=${size}`),
    postRequest("/api/public/items/search", { page: 0, size, categoryId }, ""),
  ]);

  const ranked =
    rankedResult.status === "fulfilled" ? rankedResult.value.data?.content || [] : [];
  const categoryItems =
    categoryResult.status === "fulfilled" ? categoryResult.value.data?.content || [] : [];

  const seen = new Set(ranked.map((item) => item.itemId));
  const fillers = categoryItems.filter((item) => !seen.has(item.itemId));

  return [...ranked, ...fillers].slice(0, size);
};

export const submitItemRating = async (itemId, rating, comment = "") => {
  const response = await postRequest(
    `/api/itemRatings/item/${itemId}`,
    { rating, comment },
    ""
  );
  return await response;
};

export const getItemRatingStarDistribution = async (itemId) => {
  const response = await getRequest(
    `/api/public/items/${itemId}/ratings/starDistribution`
  );
  return await response;
};

export const getItemRatings = async (itemId) => {
  const response = await getRequest(`/api/itemRatings/item/${itemId}`);
  return await response;
};
export const getThumbnailUrl = (imageUrl) => {
  if (!imageUrl) return null;

  const lastSlashIndex = imageUrl.lastIndexOf("/");
  const path = imageUrl.substring(0, lastSlashIndex + 1);
  const fileName = imageUrl.substring(lastSlashIndex + 1);
  return `${path}thumb_${fileName}`;
};

// Next.js keeps dynamic route params URL-encoded (it does not decode them),
// so route values arrive like "%D9%87%D8%A7%D9%84%D9%83". Decode to the text
// the user actually typed; on malformed input (stray "%") return it unchanged.
export const decodeSearchInput = (value) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

