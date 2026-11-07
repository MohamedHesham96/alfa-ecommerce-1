import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, prefetch, ...props }) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn().mockResolvedValue({ data: { itemLines: [] } }),
  postRequest: jest.fn().mockResolvedValue({ data: {} }),
  deleteRequest: jest.fn().mockResolvedValue({ data: {} }),
}));

import { AppConfigProvider } from "../context/AppConfigContext";
import { RefreshProvider } from "../context/refreshContext";
import { CartDrawerOpenProvider } from "../context/CartDrawerOpenContext";
import { MenuOpenProvider } from "../context/MenuOpenContext";
import { resetAppConfigForTests } from "../lib/appConfigStore";
import ProductInfo from "../app/user/productdetails/components/ProductInfo";
import BottomNav from "../app/user/components/BottomNav";

const product = {
  nameEn: "Test product",
  nameAr: "منتج تجريبي",
  code: "SKU-1",
  price: 100,
  oldPrice: 120,
  descriptionAr: "وصف",
  descriptionEn: "Description",
  available: true,
  averageRating: 4.5,
  ratingCount: 3,
  category: {
    id: 1,
    nameAr: "فئة",
    nameEn: "Category",
    seoCode: "category",
  },
};

function wrap(ui, config) {
  return (
    <AppConfigProvider initialConfig={config}>
      <RefreshProvider>
        <MenuOpenProvider>
          <CartDrawerOpenProvider>{ui}</CartDrawerOpenProvider>
        </MenuOpenProvider>
      </RefreshProvider>
    </AppConfigProvider>
  );
}

describe("dynamic UI configuration", () => {
  beforeEach(() => {
    resetAppConfigForTests();
  });

  it("hides SKU, stock status, and wishlist when disabled", async () => {
    render(
      wrap(
        <ProductInfo
          product={product}
          itemId={1}
          showSku={false}
          showStockStatus={false}
        />,
        {
          "catalog.showSku": false,
          "catalog.showStockStatus": false,
          "features.wishlist.enabled": false,
        },
      ),
    );

    await waitFor(() => {
      expect(screen.queryByText("addToWishList")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("SKU-1")).not.toBeInTheDocument();
    expect(screen.queryByText("available_in_store")).not.toBeInTheDocument();
  });

  it("renders SKU, stock status, and wishlist when enabled", async () => {
    render(
      wrap(
        <ProductInfo
          product={product}
          itemId={1}
          showSku
          showStockStatus
        />,
        {
          "catalog.showSku": true,
          "catalog.showStockStatus": true,
          "features.wishlist.enabled": true,
        },
      ),
    );

    expect(await screen.findByText("addToWishList")).toBeInTheDocument();
    expect(screen.getByText("SKU-1")).toBeInTheDocument();
    expect(screen.getByText("available_in_store")).toBeInTheDocument();
  });

  it("removes the wishlist navigation entry when the feature is disabled", async () => {
    render(wrap(<BottomNav />, { "features.wishlist.enabled": false }));

    await waitFor(() => {
      expect(screen.queryByText("wishlist")).not.toBeInTheDocument();
    });
    expect(screen.getByText("cart")).toBeInTheDocument();
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("shows the wishlist navigation entry when the feature is enabled", async () => {
    render(wrap(<BottomNav />, { "features.wishlist.enabled": true }));

    expect(await screen.findByText("wishlist")).toBeInTheDocument();
  });
});
