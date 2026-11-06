import { act, renderHook, waitFor } from "@testing-library/react";

import { createProductsColumns } from "../app/admin/config/productsTable.config";
import { createCategoryColumns } from "../app/admin/config/categoriesTable.config";
import { useServerDataTable } from "../app/admin/hooks/useServerDataTable";
import { searchTable } from "../app/admin/services/adminTableService";

jest.mock("../app/admin/services/adminTableService", () => ({
  searchTable: jest.fn(),
}));

const t = (key) => key;
const noop = jest.fn();

function page() {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  };
}

function lastRequest() {
  return searchTable.mock.calls[searchTable.mock.calls.length - 1][1];
}

function renderProducts(locale) {
  const columns = createProductsColumns({
    t,
    locale,
    onOpen: noop,
    onToggleFavorite: noop,
    onToggleActive: noop,
    onToggleAvailable: noop,
    onDelete: noop,
  });
  return renderHook(() =>
    useServerDataTable({
      endpoint: "/api/admin/items/search",
      columns,
      pageSize: 10,
    }),
  );
}

describe("admin search language fields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchTable.mockResolvedValue(page());
  });

  it("filters products and categories by Arabic fields in the Arabic UI", async () => {
    const { result } = renderProducts("ar");
    await waitFor(() => expect(searchTable).toHaveBeenCalled());

    act(() => {
      result.current.setColumnFilters([
        { id: "product", value: { operator: "CONTAINS", value: "هاتف" } },
        { id: "category", value: { operator: "CONTAINS", value: "هواتف" } },
      ]);
    });

    await waitFor(() => expect(searchTable.mock.calls.length).toBeGreaterThan(1));
    expect(lastRequest().filters).toEqual([
      { field: "nameAr", operator: "CONTAINS", value: "هاتف" },
      { field: "itemCategory.nameAr", operator: "CONTAINS", value: "هواتف" },
    ]);
  });

  it("keeps the English fields in the English UI", async () => {
    const { result } = renderProducts("en");
    await waitFor(() => expect(searchTable).toHaveBeenCalled());

    act(() => {
      result.current.setColumnFilters([
        { id: "product", value: { operator: "CONTAINS", value: "Phone" } },
        { id: "category", value: { operator: "CONTAINS", value: "Phones" } },
      ]);
    });

    await waitFor(() => expect(searchTable.mock.calls.length).toBeGreaterThan(1));
    expect(lastRequest().filters).toEqual([
      { field: "nameEn", operator: "CONTAINS", value: "Phone" },
      { field: "itemCategory.nameEn", operator: "CONTAINS", value: "Phones" },
    ]);
  });

  it("filters categories by the Arabic name field in the Arabic UI", async () => {
    const columns = createCategoryColumns({
      t,
      locale: "ar",
      onOpen: noop,
      onEdit: noop,
      onDelete: noop,
    });
    const { result } = renderHook(() =>
      useServerDataTable({
        endpoint: "/api/admin/itemCategory/search",
        columns,
        pageSize: 10,
      }),
    );

    await waitFor(() => expect(searchTable).toHaveBeenCalled());
    act(() => {
      result.current.setColumnFilters([
        { id: "name", value: { operator: "CONTAINS", value: "هواتف" } },
      ]);
    });

    await waitFor(() => expect(searchTable.mock.calls.length).toBeGreaterThan(1));
    expect(lastRequest().filters).toEqual([
      { field: "nameAr", operator: "CONTAINS", value: "هواتف" },
    ]);
  });
});
