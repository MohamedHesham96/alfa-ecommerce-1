import type {
  SalesReportDataQuality,
  SalesReportFilter,
} from "../../types/salesReport.types";

export function formatMoney(
  value: number | null | undefined,
  locale: string,
  currency: string,
  digits = 2,
) {
  const number = Number(value ?? 0);
  const currencyLabel =
    currency === "EGP" && locale === "ar" ? "ج.م" : currency;
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(number) ? number : 0)} ${currencyLabel}`;
}

export function formatMoneyCompact(
  value: number | null | undefined,
  locale: string,
) {
  const number = Number(value ?? 0);
  if (Math.abs(number) >= 1_000_000) {
    return `${(number / 1_000_000).toLocaleString(
      locale === "ar" ? "ar-EG" : "en-US",
      { maximumFractionDigits: 1 },
    )}M`;
  }
  if (Math.abs(number) >= 1_000) {
    return `${(number / 1_000).toLocaleString(
      locale === "ar" ? "ar-EG" : "en-US",
      { maximumFractionDigits: 1 },
    )}K`;
  }
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
}

export function formatNumber(value: number | null | undefined, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(
    Number(value ?? 0) || 0,
  );
}

export function formatPercent(value: number | null | undefined, locale: string) {
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0) || 0)}%`;
}

export function orderDisplayDate(order?: {
  displayCreatedDate?: string | null;
  createdDate?: string | null;
} | null) {
  return order?.displayCreatedDate ?? order?.createdDate ?? null;
}

export function formatOrderDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  // The backend supplies an offset-free report-display wall time. Parse the
  // components directly so the browser timezone never shifts the displayed
  // order date.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  const date = match
    ? new Date(
        Date.UTC(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
          Number(match[4]),
          Number(match[5]),
        ),
      )
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatInstantInZone(
  value: string | null | undefined,
  locale: string,
  timeZone?: string,
) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timeZone || undefined,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatRange(range?: {
  startDate?: string;
  endDateInclusive?: string;
} | null) {
  if (!range?.startDate || !range?.endDateInclusive) return "";
  return `${range.startDate} — ${range.endDateInclusive}`;
}

export function cloneFilters(filters: SalesReportFilter): SalesReportFilter {
  return {
    ...filters,
    fromDate: filters.fromDate ?? null,
    toDate: filters.toDate ?? null,
    orderStates: [...(filters.orderStates ?? [])],
    paymentMethods: [...(filters.paymentMethods ?? [])],
    fulfillmentTypes: [...(filters.fulfillmentTypes ?? [])],
    userIds: [...(filters.userIds ?? [])],
    productIds: [...(filters.productIds ?? [])],
    categoryIds: [...(filters.categoryIds ?? [])],
    minOrderValue:
      filters.minOrderValue === null || filters.minOrderValue === undefined
        ? null
        : Number(filters.minOrderValue),
    maxOrderValue:
      filters.maxOrderValue === null || filters.maxOrderValue === undefined
        ? null
        : Number(filters.maxOrderValue),
    compare: Boolean(filters.compare),
  };
}

export function countActiveFilters(filters: SalesReportFilter) {
  let count = 0;
  if (filters.datePreset !== "THIS_MONTH" || filters.fromDate || filters.toDate) {
    count += 1;
  }
  if (filters.orderStates?.length) count += 1;
  if (filters.paymentMethods?.length) count += 1;
  if (filters.fulfillmentTypes?.length) count += 1;
  if (filters.userIds?.length) count += 1;
  if (filters.productIds?.length) count += 1;
  if (filters.categoryIds?.length) count += 1;
  if (filters.minOrderValue !== null && filters.minOrderValue !== undefined) count += 1;
  if (filters.maxOrderValue !== null && filters.maxOrderValue !== undefined) count += 1;
  return count;
}

export function mergeAppliedFilters(
  applied: SalesReportFilter,
  partial: Partial<SalesReportFilter>,
): SalesReportFilter {
  return cloneFilters({ ...applied, ...partial });
}

/**
 * Returns the unique orphan-return total, or `null` when the payload cannot
 * prove one.
 *
 * The current API supplies `global.totalOrphanReturns`. Legacy payloads may
 * supply `returnsWithoutOrderLine` (missing line) and `returnsWithoutOrder`
 * (missing line or missing order). The missing-line set is a subset of the
 * legacy union, so the union counter is the unique total when both counters are
 * consistent. A lone missing-line counter cannot represent missing-order-only
 * orphans, and conflicting or invalid counters are not trustworthy.
 */
export function orphanReturnCount(
  dataQuality?: SalesReportDataQuality | null,
): number | null {
  const globalCount = dataQuality?.global?.totalOrphanReturns;
  if (globalCount !== undefined && globalCount !== null) {
    return validCount(globalCount) ? globalCount : null;
  }

  const withoutLine = dataQuality?.returns?.returnsWithoutOrderLine;
  const withoutOrder = dataQuality?.returns?.returnsWithoutOrder;
  const hasWithoutLine = withoutLine !== undefined && withoutLine !== null;
  const hasWithoutOrder = withoutOrder !== undefined && withoutOrder !== null;

  if (!hasWithoutOrder) {
    return null;
  }
  if (!validCount(withoutOrder)) {
    return null;
  }
  if (hasWithoutLine) {
    if (!validCount(withoutLine) || withoutLine > withoutOrder) {
      return null;
    }
  }
  return withoutOrder;
}

function validCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function orderStateTone(state: string) {
  const tones: Record<string, string> = {
    PROCESSING: "processing",
    SHIPPED: "shipped",
    PENDING: "pending",
    CANCELLED: "cancelled",
    DELIVERED: "delivered",
  };
  return tones[state] ?? "neutral";
}

export function customerLabel(customer?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
} | null) {
  if (!customer) return "—";
  const name = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
  return name || customer.username || customer.email || "—";
}

export function bucketEndDate(
  bucketStart: string,
  granularity: "DAY" | "WEEK" | "MONTH",
) {
  const parts = bucketStart.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return bucketStart;
  }
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (granularity === "WEEK") date.setUTCDate(date.getUTCDate() + 6);
  if (granularity === "MONTH") {
    date.setUTCMonth(date.getUTCMonth() + 1);
    date.setUTCDate(0);
  }
  return date.toISOString().slice(0, 10);
}
