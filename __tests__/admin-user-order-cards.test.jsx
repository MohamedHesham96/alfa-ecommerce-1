import { render, screen, within } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("../context/LanguageContext.js", () => ({
  useLanguage: () => ({
    locale: "ar",
    t: (key) => key,
  }),
}));

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(),
  postRequest: jest.fn(),
}));

jest.mock("../app/admin/UsersPage/components/userOrder", () => ({
  __esModule: true,
  default: () => null,
}));

import UserInfo from "../app/admin/UsersPage/components/userInfo";
import { getRequest } from "../utils/requestsUtils";

describe("admin customer order cards", () => {
  it("shows the total and per-state order counts returned by the API", async () => {
    getRequest.mockResolvedValue({
      data: {
        username: "medo",
        firstName: "Mohamed",
        lastName: "Hesham",
        email: "medo@gmail.com",
        phone: "01013807088",
        address: "القاهرة - اليوم - شارع 5",
        active: true,
        blocked: false,
        ordersCount: 6,
        ordersState: [
          { state: "PENDING", count: 2, percentage: 33.3 },
          { state: "PROCESSING", count: 1, percentage: 16.7 },
          { state: "SHIPPED", count: 1, percentage: 16.7 },
          { state: "DELIVERED", count: 2, percentage: 33.3 },
        ],
      },
    });

    render(<UserInfo userId={140} />);

    await screen.findAllByText("Mohamed Hesham");

    const totalCard = screen.getByText("total_orders").closest(
      ".admin-stat-card",
    );
    expect(within(totalCard).getByText("6")).toBeInTheDocument();

    const pendingCard = screen.getByText("pending_orders").closest(
      ".admin-stat-card",
    );
    expect(within(pendingCard).getByText("2")).toBeInTheDocument();

    const processingCard = screen.getByText("processing_orders").closest(
      ".admin-stat-card",
    );
    expect(within(processingCard).getByText("1")).toBeInTheDocument();

    const shippedCard = screen.getByText("shipped_orders").closest(
      ".admin-stat-card",
    );
    expect(within(shippedCard).getByText("1")).toBeInTheDocument();

    const deliveredCard = screen.getByText("delivered_orders").closest(
      ".admin-stat-card",
    );
    expect(within(deliveredCard).getByText("2")).toBeInTheDocument();
  });
});
