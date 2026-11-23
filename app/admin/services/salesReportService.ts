import {
  deleteRequest,
  downloadRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../../utils/requestsUtils.js";
import type { ApiPage, ApiResponse } from "../types/table.types";
import type {
  SavedReportFilter,
  SavedReportFilterRequest,
  SalesOrderPage,
  SalesReportFilter,
  SalesReportOrdersRequest,
  SalesReportSummary,
} from "../types/salesReport.types";

const BASE = "/api/admin/reports/sales";

export async function fetchSalesReportSummary(
  filters: SalesReportFilter,
  signal?: AbortSignal,
  options: { includeDataQuality?: boolean } = {},
): Promise<SalesReportSummary> {
  const query =
    options.includeDataQuality === false ? "?includeDataQuality=false" : "";
  const response = (await postRequest(`${BASE}/summary${query}`, filters, "", false, {
    signal,
  })) as ApiResponse<SalesReportSummary>;
  if (!response?.data) throw new Error("Invalid sales report response");
  return response.data;
}

export async function fetchSalesReportOrders(
  request: SalesReportOrdersRequest,
  signal?: AbortSignal,
): Promise<SalesOrderPage> {
  const response = (await postRequest(
    `${BASE}/orders/search`,
    request,
    "",
    false,
    { signal },
  )) as ApiResponse<SalesOrderPage | ApiPage<Record<string, unknown>>>;
  if (!response?.data) throw new Error("Invalid sales report orders response");
  const raw = response.data as SalesOrderPage & {
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
  };
  const page = raw.page ?? {
    size: raw.size ?? request.size,
    number: raw.number ?? request.page,
    totalElements: raw.totalElements ?? 0,
    totalPages: raw.totalPages ?? 0,
  };
  return {
    content: Array.isArray(raw.content) ? raw.content : [],
    page: {
      size: Number(page.size) || request.size,
      number: Number(page.number) || 0,
      totalElements: Number(page.totalElements) || 0,
      totalPages: Number(page.totalPages) || 0,
    },
  };
}

export async function fetchSavedReportFilters(): Promise<SavedReportFilter[]> {
  const response = (await getRequest(`${BASE}/saved-filters`)) as ApiResponse<
    SavedReportFilter[]
  >;
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createSavedReportFilter(
  request: SavedReportFilterRequest,
): Promise<SavedReportFilter> {
  const response = (await postRequest(
    `${BASE}/saved-filters`,
    request,
    "",
    false,
  )) as ApiResponse<SavedReportFilter>;
  if (!response?.data) throw new Error("Invalid saved filter response");
  return response.data;
}

export async function updateSavedReportFilter(
  savedFilterId: number,
  request: SavedReportFilterRequest,
): Promise<SavedReportFilter> {
  const response = (await putRequest(
    `${BASE}/saved-filters/${savedFilterId}`,
    request,
    "",
  )) as ApiResponse<SavedReportFilter>;
  if (!response?.data) throw new Error("Invalid saved filter response");
  return response.data;
}

export async function deleteSavedReportFilter(
  savedFilterId: number,
  confirmationMessage: string,
) {
  return deleteRequest(
    `${BASE}/saved-filters/${savedFilterId}`,
    confirmationMessage,
  );
}

export async function setDefaultSavedReportFilter(
  savedFilterId: number,
): Promise<SavedReportFilter> {
  const response = (await postRequest(
    `${BASE}/saved-filters/${savedFilterId}/default`,
    {},
    "",
    false,
  )) as ApiResponse<SavedReportFilter>;
  if (!response?.data) throw new Error("Invalid saved filter response");
  return response.data;
}

export async function downloadSalesReport(
  filters: SalesReportFilter,
  locale: "ar" | "en",
) {
  return downloadRequest(`${BASE}/export`, {
    filters,
    format: "XLSX",
    locale,
  });
}

export interface LookupOption {
  value: number;
  label: string;
  description?: string;
}

interface SalesLookupRow {
  id: number;
  code?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  subtitle?: string | null;
}

export async function searchCustomerOptions(
  search: string,
): Promise<LookupOption[]> {
  const query = new URLSearchParams({
    search: search ?? "",
    limit: "20",
  });
  const response = (await getRequest(
    `${BASE}/lookups/customers?${query.toString()}`,
    { suppressErrorToast: true },
  )) as ApiResponse<SalesLookupRow[]>;
  return (response?.data ?? []).map((user) => ({
    value: Number(user.id),
    label: `${String(user.labelEn || user.labelAr || "").trim()}${
      user.subtitle ? ` — ${user.subtitle}` : ""
    }`,
    description: String(user.labelAr ?? "").trim(),
  }));
}

export async function searchProductOptions(
  search: string,
  locale: "ar" | "en" = "en",
): Promise<LookupOption[]> {
  const query = new URLSearchParams({
    search: search ?? "",
    limit: "20",
  });
  const response = (await getRequest(
    `${BASE}/lookups/products?${query.toString()}`,
    { suppressErrorToast: true },
  )) as ApiResponse<SalesLookupRow[]>;
  return (response?.data ?? []).map((item) => ({
    value: Number(item.id),
    label: `${String(
      (locale === "ar" ? item.labelAr || item.labelEn : item.labelEn || item.labelAr) || "",
    ).trim()}${item.code ? ` (${item.code})` : ""}`,
    description: String(
      locale === "ar" ? item.labelEn ?? "" : item.labelAr ?? "",
    ).trim(),
  }));
}

interface CategoryLookupRow {
  itemCategoryId: number;
  nameEn?: string | null;
  nameAr?: string | null;
  children?: CategoryLookupRow[] | null;
}

export async function fetchCategoryOptions(
  locale: "ar" | "en" = "en",
): Promise<LookupOption[]> {
  const response = (await getRequest(
    "/api/admin/itemCategory/getCategoryWithItemCounts",
    { suppressErrorToast: true },
  )) as ApiResponse<CategoryLookupRow[]>;
  const rows = Array.isArray(response?.data) ? response.data : [];
  const options: LookupOption[] = [];
  const walk = (category: CategoryLookupRow, depth: number) => {
    const name =
      (locale === "ar" ? category.nameAr || category.nameEn : category.nameEn || category.nameAr) ||
      "";
    options.push({
      value: Number(category.itemCategoryId),
      label: `${"— ".repeat(depth)}${name}`,
      description: category.nameAr ?? "",
    });
    (category.children ?? []).forEach((child) => walk(child, depth + 1));
  };
  rows.forEach((row) => walk(row, 0));
  return options;
}

export function encodeFiltersForUrl(filters: SalesReportFilter): string {
  const json = JSON.stringify(filters);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeFiltersFromUrl(value: string | null): SalesReportFilter | null {
  if (!value) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(json) as SalesReportFilter;
  } catch {
    return null;
  }
}

export function buildSalesReportPrintUrl(filters: SalesReportFilter): string {
  return `/admin/Reports/Sales/Print?filters=${encodeURIComponent(
    encodeFiltersForUrl(filters),
  )}`;
}
