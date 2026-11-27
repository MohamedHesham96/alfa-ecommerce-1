import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import OrdersHistory from "../app/user/ordershistory/components/ordersHistory";
import { LanguageProvider } from "../context/LanguageContext";
import { postRequest } from "../utils/requestsUtils";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../context/idContext", () => ({
  useIdContext: () => ({ setSelectedProductId: jest.fn() }),
}));

jest.mock("../utils/requestsUtils", () => ({
  postRequest: jest.fn(),
}));

const order = {
  orderId: 33,
  code: "ORD-2026-000033",
  createdDate: "2026-11-10T12:30:00",
  state: "PROCESSING",
  fulfillmentType: "PICKUP",
  paymentMethod: "CASH_ON_DELIVERY",
  netTotal: 1200,
  orderItemLines: [
    {
      itemLineId: 1,
      quantity: 1,
      unitPrice: 950,
      item: {
        itemId: 5,
        nameAr: "شاشة سامسونج",
        nameEn: "Samsung Monitor",
        images: [{ imageUrl: "/items/test.png" }],
      },
    },
    {
      itemLineId: 2,
      quantity: 2,
      unitPrice: 125,
      item: {
        itemId: 6,
        nameAr: "كابل HDMI",
        nameEn: "HDMI Cable",
        images: [{ imageUrl: "/items/cable.png" }],
      },
    },
  ],
};

const pageResponse = {
  data: {
    content: [order],
    totalPages: 1,
    totalElements: 1,
  },
};

function renderOrders() {
  return render(
    <LanguageProvider>
      <OrdersHistory />
    </LanguageProvider>,
  );
}

describe("orders history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    postRequest.mockResolvedValue(pageResponse);
  });

  it("renders the order card with status, items and total", async () => {
    renderOrders();

    expect(await screen.findByText("ORD-2026-000033")).toBeInTheDocument();
    const card = screen.getByText("ORD-2026-000033").closest("article");
    expect(within(card).getByText("شاشة سامسونج")).toBeInTheDocument();
    expect(within(card).getByText("كابل HDMI")).toBeInTheDocument();
    expect(within(card).getByText("جاري المعالجة")).toBeInTheDocument();
    expect(within(card).getByText("الاستلام")).toBeInTheDocument();
    expect(within(card).getByText(/1,200/)).toBeInTheDocument();
  });

  it("uses the existing orderState filter when a tab is selected", async () => {
    renderOrders();
    await screen.findByText("ORD-2026-000033");

    fireEvent.click(screen.getByRole("button", { name: "تم الشحن" }));

    await waitFor(() => {
      expect(postRequest).toHaveBeenLastCalledWith(
        "/api/orders/search",
        expect.objectContaining({
          page: 0,
          size: 5,
          orderState: "SHIPPED",
        }),
        "",
        false,
        expect.objectContaining({ suppressErrorToast: true }),
      );
    });
  });

  it("sends the typed search text with the existing search API", async () => {
    renderOrders();
    await screen.findByText("ORD-2026-000033");

    const input = screen.getByRole("searchbox", {
      name: "البحث برقم الطلب...",
    });
    fireEvent.change(input, { target: { value: "ORD-2026" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(postRequest).toHaveBeenLastCalledWith(
        "/api/orders/search",
        expect.objectContaining({
          searchText: "ORD-2026",
          orderState: "",
        }),
        "",
        false,
        expect.objectContaining({ suppressErrorToast: true }),
      );
    });
  });

  it("shows the empty state with a link to start shopping", async () => {
    postRequest.mockResolvedValueOnce({
      data: { content: [], totalPages: 0, totalElements: 0 },
    });
    renderOrders();

    expect(
      await screen.findByText("لا توجد طلبات حتى الآن"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تسوق الأن" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows an error state with a retry action", async () => {
    postRequest.mockRejectedValueOnce(new Error("network"));
    renderOrders();

    expect(
      await screen.findByText("تعذر تحميل الطلبات. حاول مرة أخرى."),
    ).toBeInTheDocument();

    postRequest.mockResolvedValueOnce(pageResponse);
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));

    expect(await screen.findByText("ORD-2026-000033")).toBeInTheDocument();
  });
});
