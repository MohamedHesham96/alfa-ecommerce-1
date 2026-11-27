import { fireEvent, render, screen } from "@testing-library/react";

import WishList from "../app/user/wishlist/components/WishList";
import { LanguageProvider } from "../context/LanguageContext";
import { getRequest } from "../utils/requestsUtils";

jest.mock("../app/user/components/ProductCard", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ productInfo }) =>
      React.createElement(
        "div",
        null,
        productInfo?.nameAr || productInfo?.nameEn || "",
      ),
  };
});

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(),
  postRequest: jest.fn(),
}));

const signedInList = {
  data: {
    content: [
      { item: { itemId: 1, nameAr: "منتج أول" } },
      { item: { itemId: 2, nameAr: "منتج ثانٍ" } },
    ],
  },
};

function renderWishlist() {
  return render(
    <LanguageProvider>
      <WishList />
    </LanguageProvider>,
  );
}

describe("wishlist page", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders the saved products and their count", async () => {
    localStorage.setItem("id", "1");
    getRequest.mockResolvedValue(signedInList);

    renderWishlist();

    expect(await screen.findByText("منتج أول")).toBeInTheDocument();
    expect(screen.getByText("منتج ثانٍ")).toBeInTheDocument();
    expect(screen.getByText(/لديك في القائمة/)).toHaveTextContent("2");
    expect(getRequest).toHaveBeenCalledWith(
      "/api/users/favoriteItems",
      expect.objectContaining({ suppressErrorToast: true }),
    );
  });

  it("shows an empty state with a link to start shopping", async () => {
    localStorage.setItem("id", "1");
    getRequest.mockResolvedValue({ data: { content: [] } });

    renderWishlist();

    expect(
      await screen.findByText("قائمة أمنياتك فارغة"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تسوق الأن" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows an error state and retries with the same request", async () => {
    localStorage.setItem("id", "1");
    getRequest.mockRejectedValueOnce(new Error("network"));

    renderWishlist();

    expect(
      await screen.findByText("تعذر تحميل قائمة الأمنيات. حاول مرة أخرى."),
    ).toBeInTheDocument();

    getRequest.mockResolvedValueOnce(signedInList);
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));

    expect(await screen.findByText("منتج أول")).toBeInTheDocument();
  });

  it("loads a guest wishlist from local storage without the user endpoint", async () => {
    localStorage.setItem("favoriteItems", JSON.stringify([{ id: 7 }]));
    getRequest.mockResolvedValue({
      data: { itemId: 7, nameAr: "منتج الضيف" },
    });

    renderWishlist();

    expect(await screen.findByText("منتج الضيف")).toBeInTheDocument();
    expect(getRequest).toHaveBeenCalledWith(
      "/api/public/items/7",
      expect.objectContaining({ suppressErrorToast: true }),
    );
    expect(getRequest).not.toHaveBeenCalledWith(
      "/api/users/favoriteItems",
      expect.anything(),
    );
  });
});
