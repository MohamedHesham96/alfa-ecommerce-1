export type SalesDatePreset =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "THIS_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "THIS_YEAR"
  | "CUSTOM";

export interface SalesReportFilter {
  datePreset: SalesDatePreset;
  fromDate: string | null;
  toDate: string | null;
  orderStates: string[];
  paymentMethods: string[];
  fulfillmentTypes: string[];
  userIds: number[];
  productIds: number[];
  categoryIds: number[];
  minOrderValue: number | null;
  maxOrderValue: number | null;
  compare: boolean;
}

export interface SalesReportRange {
  preset: string;
  start: string;
  endExclusive: string;
  startDate: string;
  endDateInclusive: string;
}

export interface SalesReportMetrics {
  grossSales: number;
  netSales: number;
  deliveredRevenue: number;
  shippingCharges: number;
  totalDiscounts: number;
  totalOrders: number;
  averageOrderValue: number;
  itemsSold: number;
  cancelledOrders: number;
  cancelledMerchandiseValue: number;
  cancelledShippingValue: number;
  cancelledTotalValue: number;
  returnedOrders: number;
}

export interface SalesMetricDelta {
  currentValue: number;
  previousValue: number;
  absoluteDifference: number;
  percentageDifference: number | null;
}

export interface SalesReportComparison {
  enabled: boolean;
  range?: SalesReportRange;
  metrics?: SalesReportMetrics;
  deltas?: Record<string, SalesMetricDelta>;
}

export interface SalesCompositionSlice {
  key: string;
  orders: number;
  merchandiseValue: number;
  sharePercent: number;
}

export interface SalesOverTimePoint {
  bucketStart: string;
  granularity: "DAY" | "WEEK" | "MONTH";
  orders: number;
  grossSales: number;
  netSales: number;
  deliveredRevenue: number;
  itemsSold: number;
}

export interface SalesCategorySlice {
  categoryId: number;
  nameEn: string;
  nameAr: string;
  quantity: number;
  merchandiseValue: number;
  sharePercent: number;
}

export interface SalesTopProduct {
  itemId: number;
  code: string;
  nameEn: string;
  nameAr: string;
  quantity: number;
  merchandiseValue: number;
}

export interface SalesDayHourPoint {
  dayOfWeek: number;
  hour: number;
  orders: number;
  merchandiseValue: number;
}

export interface SalesReportDataQuality {
  ordersMissingCreatedDate: number;
  ordersMissingTotal: number;
  ordersWithLegacyNetTotalMismatch: number;
  financial?: {
    ordersMissingShippingCost: number;
    ordersMissingNetTotal: number;
    ordersWithNegativeFinancialValue: number;
    ordersWithDiscountMismatch: number;
  } | null;
  orderItems?: {
    ordersWithoutLines: number;
    ordersWithMerchandiseMismatch: number;
    linesMissingUnitPrice: number;
    linesMissingTotalPrice: number;
    linesWithNegativePrice: number;
    linesWithInvalidQuantity: number;
    linesWithTotalMismatch: number;
    linesWithNullReturnedQuantity: number;
    linesWithNegativeReturnedQuantity: number;
    linesWithReturnedQuantityMismatch: number;
  } | null;
  returns?: {
    returnsWithoutOrderLine: number;
    returnsWithoutOrder: number;
    returnsWithInvalidQuantity: number;
    linesWithReturnedQuantityExceedingPurchased: number;
    returnsWithInvalidState: number;
    returnsWithNegativeRefund: number;
    refundAmountMismatches: number;
  } | null;
  global?: {
    ordersMissingCreatedDate: number;
    returnsWithoutOrderOnly: number;
    totalOrphanReturns: number;
  } | null;
}

export interface SalesReportTimestampMetadata {
  configuredMode: "AUTO" | "SITE_LOCAL" | "UTC" | string;
  resolvedMode: "SITE_LOCAL" | "UTC" | string;
  timezone: string;
}

export interface SalesReportSummary {
  reportKey: string;
  currency: string;
  timezone: string;
  generatedAt: string;
  generatedAtDisplay?: string | null;
  timestampMetadata?: SalesReportTimestampMetadata | null;
  range: SalesReportRange;
  comparison: SalesReportComparison;
  availability: {
    collectedRevenue: boolean;
    outstandingAmount: boolean;
    paymentStatus: boolean;
    verifiedRefundedAmount: boolean;
    couponFiltering: boolean;
  };
  metrics: SalesReportMetrics;
  composition: {
    byPaymentMethod: SalesCompositionSlice[];
    byFulfillmentType: SalesCompositionSlice[];
    byOrderStatus: SalesCompositionSlice[];
  };
  salesOverTime: SalesOverTimePoint[];
  salesByCategory: SalesCategorySlice[];
  topProducts: SalesTopProduct[];
  salesByDayHour: SalesDayHourPoint[];
  dataQuality?: SalesReportDataQuality | null;
}

export interface SalesOrderCustomer {
  userId: number;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
}

export interface SalesOrderRow {
  orderId: number;
  code: string;
  /** Raw persisted wall-clock value. Kept for sorting/debugging. */
  createdDate?: string | null;
  /** Report-display value calculated by the backend. */
  displayCreatedDate?: string | null;
  customer?: SalesOrderCustomer | null;
  state: string;
  paymentMethod?: string | null;
  fulfillmentType?: string | null;
  itemsCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export interface SalesReportOrdersRequest {
  filters: SalesReportFilter;
  page: number;
  size: number;
  globalSearch?: string;
  sorting: { field: string; direction: "ASC" | "DESC" }[];
}

export interface SavedReportFilter {
  savedFilterId: number;
  name: string;
  filters: SalesReportFilter | null;
  defaultFilter: boolean;
  createdDate?: string | null;
  modifiedDate?: string | null;
  valid: boolean;
  validationError?: string | null;
}

export interface SavedReportFilterRequest {
  name: string;
  filters: SalesReportFilter;
  defaultFilter: boolean;
}

export interface SalesOrderPage {
  content: SalesOrderRow[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export function createDefaultSalesReportFilter(): SalesReportFilter {
  return {
    datePreset: "THIS_MONTH",
    fromDate: null,
    toDate: null,
    orderStates: [],
    paymentMethods: [],
    fulfillmentTypes: [],
    userIds: [],
    productIds: [],
    categoryIds: [],
    minOrderValue: null,
    maxOrderValue: null,
    compare: false,
  };
}
