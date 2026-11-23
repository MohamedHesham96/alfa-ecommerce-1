import {
  bucketEndDate,
  cloneFilters,
  countActiveFilters,
  formatInstantInZone,
  formatOrderDate,
  formatRange,
  orderDisplayDate,
  orphanReturnCount,
} from "../app/admin/Reports/Sales/salesReportUtils";
import { createDefaultSalesReportFilter } from "../app/admin/types/salesReport.types";
import { createSalesReportColumns } from "../app/admin/config/salesReportTable.config";

describe("sales report utilities", () => {
  test("default filter uses This Month and no active filters", () => {
    const filters = createDefaultSalesReportFilter();
    expect(filters.datePreset).toBe("THIS_MONTH");
    expect(countActiveFilters(filters)).toBe(0);
  });

  test("active filter count reflects applied groups", () => {
    const filters = {
      ...createDefaultSalesReportFilter(),
      datePreset: "LAST_30_DAYS",
      orderStates: ["DELIVERED"],
      paymentMethods: ["CASH_ON_DELIVERY"],
      fulfillmentTypes: ["PICKUP"],
      userIds: [1],
      productIds: [2],
      categoryIds: [3],
      minOrderValue: 10,
      maxOrderValue: 20,
    };
    expect(countActiveFilters(filters)).toBe(9);
  });

  test("cloneFilters does not share arrays", () => {
    const filters = { ...createDefaultSalesReportFilter(), orderStates: ["DELIVERED"] };
    const cloned = cloneFilters(filters);
    cloned.orderStates.push("CANCELLED");
    expect(filters.orderStates).toEqual(["DELIVERED"]);
    expect(cloned.orderStates).toEqual(["DELIVERED", "CANCELLED"]);
  });

  test("bucketEndDate handles day, week and month buckets", () => {
    expect(bucketEndDate("2026-11-20", "DAY")).toBe("2026-11-20");
    expect(bucketEndDate("2026-11-16", "WEEK")).toBe("2026-11-22");
    expect(bucketEndDate("2026-02-01", "MONTH")).toBe("2026-02-28");
  });

  test("order date formatting does not apply a browser timezone shift", () => {
    const formatted = formatOrderDate("2026-11-20T14:05:11", "en");
    expect(formatted).toContain("14:05");
    expect(formatted).toContain("2026");
  });

  test("display timestamp is preferred over the raw persisted timestamp", () => {
    const order = {
      createdDate: "2026-10-31T22:30:00",
      displayCreatedDate: "2026-11-01T00:30:00",
    };
    expect(orderDisplayDate(order)).toBe("2026-11-01T00:30:00");
    const formatted = formatOrderDate(orderDisplayDate(order), "en");
    expect(formatted).toContain("00:30");
    expect(formatted).toContain("Nov");
  });

  test("raw timestamp remains the fallback when display data is absent", () => {
    expect(orderDisplayDate({ createdDate: "2026-10-31T22:30:00" })).toBe(
      "2026-10-31T22:30:00",
    );
    expect(orderDisplayDate(null)).toBeNull();
  });

  test("details column renders the backend display timestamp", () => {
    const columns = createSalesReportColumns({
      t: (key) => key,
      locale: "en",
      currency: "EGP",
      onOpen: jest.fn(),
    });
    const dateColumn = columns.find((column) => column.id === "createdDate");
    const rendered = dateColumn.cell({
      row: {
        original: {
          createdDate: "2026-10-31T22:30:00",
          displayCreatedDate: "2026-11-01T00:30:00",
        },
      },
    });
    expect(rendered).toContain("00:30");
    expect(rendered).toContain("Nov");
  });

  test("generated instant formatting uses the requested report zone", () => {
    const formatted = formatInstantInZone(
      "2026-10-31T22:30:00Z",
      "en",
      "Africa/Cairo",
    );
    expect(formatted).toMatch(/12:30|00:30/);
    expect(formatted).toContain("Nov");
  });

  test("range formatting is stable", () => {
    expect(
      formatRange({ startDate: "2026-11-01", endDateInclusive: "2026-11-30" }),
    ).toBe("2026-11-01 — 2026-11-30");
  });

  test("orphan count prefers a valid global total", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 1, returnsWithoutOrder: 3 },
        global: {
          ordersMissingCreatedDate: 0,
          returnsWithoutOrderOnly: 2,
          totalOrphanReturns: 7,
        },
      }),
    ).toBe(7);
  });

  test("global zero is authoritative", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 1, returnsWithoutOrder: 3 },
        global: {
          ordersMissingCreatedDate: 0,
          returnsWithoutOrderOnly: 2,
          totalOrphanReturns: 0,
        },
      }),
    ).toBe(0);
  });

  test("null global total falls back to consistent legacy counters", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 2, returnsWithoutOrder: 4 },
        global: {
          ordersMissingCreatedDate: 0,
          returnsWithoutOrderOnly: 2,
          totalOrphanReturns: null,
        },
      }),
    ).toBe(4);
  });

  test("invalid global total is unavailable instead of falling back", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 2, returnsWithoutOrder: 4 },
        global: {
          ordersMissingCreatedDate: 0,
          returnsWithoutOrderOnly: 2,
          totalOrphanReturns: -1,
        },
      }),
    ).toBeNull();
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        global: {
          ordersMissingCreatedDate: 0,
          returnsWithoutOrderOnly: 2,
          totalOrphanReturns: 1.5,
        },
      }),
    ).toBeNull();
  });

  test("consistent legacy counters use the union count", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 2, returnsWithoutOrder: 4 },
      }),
    ).toBe(4);
  });

  test("a lone returnsWithoutOrder is the complete legacy union", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrder: 4 },
      }),
    ).toBe(4);
  });

  test("a lone returnsWithoutOrderLine is unavailable", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 2 },
      }),
    ).toBeNull();
  });

  test("absent legacy counters are unavailable", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: {},
      }),
    ).toBeNull();
  });

  test("conflicting legacy counters are unavailable", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 4, returnsWithoutOrder: 2 },
      }),
    ).toBeNull();
  });

  test("negative or non-integer legacy counters are unavailable", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: -1, returnsWithoutOrder: 2 },
      }),
    ).toBeNull();
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 1, returnsWithoutOrder: 1.5 },
      }),
    ).toBeNull();
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: "1", returnsWithoutOrder: 2 },
      }),
    ).toBeNull();
  });

  test("explicit zero legacy counters are a valid zero", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 0, returnsWithoutOrder: 0 },
      }),
    ).toBe(0);
  });

  test("one return missing only its order is counted once", () => {
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: { returnsWithoutOrderLine: 0, returnsWithoutOrder: 1 },
      }),
    ).toBe(1);
  });

  test("absent or null diagnostics are unavailable", () => {
    expect(orphanReturnCount(undefined)).toBeNull();
    expect(orphanReturnCount(null)).toBeNull();
    expect(
      orphanReturnCount({
        ordersMissingCreatedDate: 0,
        ordersMissingTotal: 0,
        ordersWithLegacyNetTotalMismatch: 0,
        returns: null,
        global: null,
      }),
    ).toBeNull();
  });
});
