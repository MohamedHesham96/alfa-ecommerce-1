import { render, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    const React = require("react");
    return React.createElement("img", {
      ...props,
      src: props.src || "/placeholder.png",
    });
  },
}));

jest.mock("../app/admin/services/adminTableService", () => ({
  searchTable: jest.fn(),
}));

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  deleteRequest: jest.fn(),
}));

jest.mock("../app/admin/Categories/components/ProductsByCategoryPopup", () => ({
  __esModule: true,
  default: () => null,
}));

import AdminsTable from "../app/admin/Admins/components/AdminsTable";
import UsersTable from "../app/admin/UsersPage/components/Users_Table";
import OrdersTable from "../app/admin/orders/components/Orders_Table";
import ReturnsTable from "../app/admin/Returns/components/Table";
import CategoryTable from "../app/admin/Categories/components/CategoryTable";
import ShippingTable from "../app/admin/ShippingCost/components/Table";
import DashboardTable from "../app/admin/Dashboard/components/Table";
import OrderItems from "../app/admin/orders/OrdersDetails/components/Order_Items";
import { searchTable } from "../app/admin/services/adminTableService";
import { getRequest } from "../utils/requestsUtils";
import { IdProvider } from "../context/idContext";
import { RefreshProvider } from "../context/refreshContext";
import { NamePageInAdminProvider } from "../context/namePageInAdmin";
import { OrderDetailsProvider } from "../context/orderDetailsContext";

function page(content = []) {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    number: 0,
    size: 15,
    first: true,
    last: true,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

function wrap(children) {
  return (
    <IdProvider>
      <RefreshProvider>
        <NamePageInAdminProvider>{children}</NamePageInAdminProvider>
      </RefreshProvider>
    </IdProvider>
  );
}

describe("admin screens use the shared server table contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchTable.mockResolvedValue(page());
    getRequest.mockResolvedValue({ data: { pendingOrders: [] } });
  });

  it.each([
    ["admins", () => wrap(<AdminsTable setIsFormOpen={jest.fn()} />), "/api/admin/admins/search"],
    ["users", () => wrap(<UsersTable />), "/api/admin/users/search"],
    ["orders", () => wrap(<OrdersTable />), "/api/admin/orders/search"],
    ["returns", () => wrap(<ReturnsTable />), "/api/admin/return-orders/search"],
    [
      "categories",
      () => wrap(<CategoryTable setIsFormOpen={jest.fn()} />),
      "/api/admin/itemCategory/search",
    ],
    [
      "shipping",
      () =>
        wrap(
          <ShippingTable
            setGovernorate={jest.fn()}
            setGovernorateId={jest.fn()}
            setGovernoratePrice={jest.fn()}
            setShowForm={jest.fn()}
          />,
        ),
      "/api/admin/shipping-rates/search",
    ],
  ])("%s uses %s", async (_name, renderTree, endpoint) => {
    render(renderTree());
    await waitFor(() => expect(searchTable).toHaveBeenCalled());
    const endpoints = searchTable.mock.calls.map((call) => call[0]);
    expect(endpoints).toContain(endpoint);
  });

  it("user order view sends the user id as a base filter", async () => {
    render(wrap(<OrdersTable mode="user" userId={42} />));
    await waitFor(() => expect(searchTable).toHaveBeenCalled());
    const request = searchTable.mock.calls[0][1];
    expect(request.filters).toEqual([
      { field: "userId", operator: "EQUALS", value: 42 },
    ]);
  });

  it("dashboard loads the existing dashboard endpoint", async () => {
    render(wrap(<DashboardTable />));
    await waitFor(() => expect(getRequest).toHaveBeenCalledWith("/api/admin/dashboard"));
  });

  it("order details loads the existing order endpoint", async () => {
    render(
      <IdProvider>
        <OrderDetailsProvider>
          <OrderItems orderId="9" orderType="orders" />
        </OrderDetailsProvider>
      </IdProvider>,
    );
    await waitFor(() =>
      expect(getRequest).toHaveBeenCalledWith("/api/admin/orders/9"),
    );
  });
});
