const en = require("../public/locales/en.json");
const ar = require("../public/locales/ar.json");

describe("sales report financial labels", () => {
  test("English merchandise label describes the after-discount value", () => {
    expect(en.sales_report_subtotal).toBe("Merchandise (After Discount)");
    expect(en.sales_report_subtotal).not.toBe("Subtotal");
  });

  test("Arabic merchandise label is concise and accurate", () => {
    expect(ar.sales_report_subtotal).toBe("قيمة البضاعة بعد الخصم");
    expect(ar.sales_report_subtotal).not.toBe("قيمة البضاعة");
  });

  test("financial chart populations are explained in both locales", () => {
    expect(en.sales_report_no_sales_chart_data).toMatch(/Cancelled orders are excluded/);
    expect(ar.sales_report_no_sales_chart_data).toMatch(/تُستبعد الطلبات الملغاة/);
    expect(en.sales_report_composition_note).toMatch(/Cancelled orders are excluded/);
    expect(ar.sales_report_composition_note).toMatch(/تُستبعد الطلبات الملغاة/);
  });

  test("Items Sold is labelled as units before returns", () => {
    expect(en.sales_report_kpi_items).toBe("Units Sold (Before Returns)");
    expect(ar.sales_report_kpi_items).toBe("الوحدات المباعة قبل المرتجعات");
    expect(en.sales_report_tip_items).toMatch(/before deducting returned quantities/i);
    expect(ar.sales_report_tip_items).toMatch(/قبل خصم الكميات المرتجعة/);
  });

  test("expanded data-quality and timestamp metadata labels exist", () => {
    expect(en.sales_report_data_quality_expanded).toContain("{lineIssues}");
    expect(ar.sales_report_data_quality_expanded).toContain("{lineIssues}");
    expect(en.sales_report_data_quality_global_returns).toContain("{count}");
    expect(ar.sales_report_data_quality_global_returns).toContain("{count}");
    expect(en.sales_report_timestamp_mode).toBe("Timestamp mode");
    expect(ar.sales_report_timestamp_mode).toBe("وضع توقيت الطلبات");
  });

  test("order date labels support a dynamic timezone suffix in both locales", () => {
    expect(en.sales_report_order_date).toBe("Order Date");
    expect(ar.sales_report_order_date).toBe("تاريخ الطلب");
  });
});
