import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import ReturnOrders from "../app/user/returnorders/components/returnOrdersHistory";
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

const returnOrder = {
  returnOrderId: 12,
  code: "RO-2026-000012",
  createdDate: "2026-11-01T10:15:00",
  state: "PENDING",
  refundAmount: 950,
  quantity: 1,
  unitPrice: 950,
  paymentMethod: "CASH_ON_DELIVERY",
  reason: "DEFECTIVE",
  reasonMessage: "الشاشة بها عيب في التصنيع",
  item: {
    itemId: 5,
    nameAr: "شاشة سامسونج",
    nameEn: "Samsung Monitor",
    images: [{ imageUrl: "/items/test.png" }],
  },
};

const pageResponse = {
  data: {
    content: [returnOrder],
    totalPages: 1,
    totalElements: 1,
  },
};

function renderReturns() {
  return render(
    <LanguageProvider>
      <ReturnOrders />
    </LanguageProvider>,
  );
}

describe("return orders history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    postRequest.mockResolvedValue(pageResponse);
  });

  it("renders the return card with its status, item and refund", async () => {
    renderReturns();

    expect(await screen.findByText("RO-2026-000012")).toBeInTheDocument();
    const card = screen.getByText("RO-2026-000012").closest("article");
    expect(within(card).getByText("شاشة سامسونج")).toBeInTheDocument();
    expect(within(card).getByText("قيد الإنتظار")).toBeInTheDocument();
    expect(screen.getByText("قيمة الاسترداد")).toBeInTheDocument();
    expect(screen.getAllByText(/950/).length).toBeGreaterThan(0);
    expect(screen.getByText(/عيب في التصنيع/)).toBeInTheDocument();
  });

  it("uses the backend returnState filter when a tab is selected", async () => {
    renderReturns();
    await screen.findByText("RO-2026-000012");

    fireEvent.click(screen.getByRole("button", { name: "تم الموافقة" }));

    await waitFor(() => {
      expect(postRequest).toHaveBeenLastCalledWith(
        "/api/return-orders/search",
        expect.objectContaining({
          page: 0,
          size: 5,
          returnState: "APPROVED",
        }),
        "",
        false,
        expect.objectContaining({ suppressErrorToast: true }),
      );
    });
  });

  it("sends the typed search text with the existing search API", async () => {
    renderReturns();
    await screen.findByText("RO-2026-000012");

    const input = screen.getByRole("searchbox", {
      name: "ابحث برقم المرتجع...",
    });
    fireEvent.change(input, { target: { value: "RO-2026" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(postRequest).toHaveBeenLastCalledWith(
        "/api/return-orders/search",
        expect.objectContaining({
          searchText: "RO-2026",
          returnState: "",
        }),
        "",
        false,
        expect.objectContaining({ suppressErrorToast: true }),
      );
    });
  });

  it("shows an error state with a retry action", async () => {
    postRequest.mockRejectedValueOnce(new Error("network"));
    renderReturns();

    expect(
      await screen.findByText("تعذر تحميل المرتجعات. حاول مرة أخرى."),
    ).toBeInTheDocument();

    postRequest.mockResolvedValueOnce(pageResponse);
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));

    expect(await screen.findByText("RO-2026-000012")).toBeInTheDocument();
  });
});
