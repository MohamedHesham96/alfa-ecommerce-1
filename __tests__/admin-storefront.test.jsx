import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "en",
    t: (key) => key,
  }),
}));

jest.mock("../context/AppConfigContext", () => ({
  useFeature: () => true,
  useAppConfig: (_key, fallback) => fallback,
}));

jest.mock("../context/refreshContext", () => ({
  useRefresh: () => ({ triggerRefresh: jest.fn(), refreshKey: 0 }),
}));

jest.mock("../context/CartDrawerOpenContext", () => ({
  useCartDrawerOpen: () => ({ setIsCartOpen: jest.fn() }),
}));

jest.mock("../context/MenuOpenContext", () => ({
  MenuOpenProvider: ({ children }) => <div>{children}</div>,
}));

jest.mock("../utils/requestsUtils", () => ({
  getRequest: jest.fn(() => Promise.resolve({ data: null })),
  postRequest: jest.fn(() => Promise.resolve({})),
  deleteRequest: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../app/user/components/StarRating", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../app/user/components/Header", () => ({
  __esModule: true,
  default: () => <div data-testid="store-header">header</div>,
}));
jest.mock("../app/user/components/Footer", () => ({
  __esModule: true,
  default: () => <div data-testid="store-footer">footer</div>,
}));
jest.mock("../app/user/components/BottomNav", () => ({
  __esModule: true,
  default: () => <div data-testid="store-bottom-nav">bottom nav</div>,
}));
jest.mock("../app/user/components/Menu", () => ({
  __esModule: true,
  default: () => <div data-testid="store-menu">menu</div>,
}));
jest.mock("../app/user/home/page", () => ({
  __esModule: true,
  default: () => <div data-testid="home-content">home content</div>,
}));

import RequireCustomer from "../app/user/components/RequireCustomer";
import HomePageClient from "../app/components/HomePageClient";
import ProductInfo from "../app/user/productdetails/components/ProductInfo";

const product = {
  itemId: 7,
  nameAr: "منتج تجريبي",
  nameEn: "Test product",
  code: "SKU-7",
  descriptionAr: "وصف",
  descriptionEn: "Description",
  price: 100,
  oldPrice: 120,
  available: true,
  averageRating: 0,
  ratingCount: 0,
  category: {
    id: 3,
    nameAr: "فئة",
    nameEn: "Category",
    seoCode: "category",
  },
  images: [],
};

function setAdminSession() {
  localStorage.setItem("id", "1");
  localStorage.setItem("role", "ADMIN");
  localStorage.setItem("accessToken", "admin-access");
  localStorage.setItem("refreshToken", "admin-refresh");
}

describe("ADMIN storefront access", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the storefront homepage for an ADMIN without redirecting", async () => {
    setAdminSession();

    render(<HomePageClient initialContact={{ whatsappURL: null }} />);

    expect(await screen.findByTestId("home-content")).toBeInTheDocument();
    expect(screen.getByTestId("store-header")).toBeInTheDocument();
    expect(screen.queryByText(/not authorized/i)).not.toBeInTheDocument();
  });

  it("shows a friendly notice instead of customer account content", async () => {
    setAdminSession();

    render(
      <RequireCustomer>
        <div>customer-only content</div>
      </RequireCustomer>,
    );

    expect(await screen.findByTestId("admin-restricted-notice")).toBeInTheDocument();
    expect(screen.queryByText("customer-only content")).not.toBeInTheDocument();
  });

  it("keeps guest storefront access unchanged", async () => {
    render(
      <RequireCustomer>
        <div>guest cart content</div>
      </RequireCustomer>,
    );

    expect(await screen.findByText("guest cart content")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-restricted-notice")).not.toBeInTheDocument();
  });

  it("disables add-to-cart and buy-now for an ADMIN", async () => {
    setAdminSession();

    render(<ProductInfo product={product} itemId={product.itemId} />);

    // Product information stays visible to the admin.
    expect(screen.getByText("Test product")).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();

    const addToCart = screen.getByRole("button", { name: "addToCart" });
    const buyNow = screen.getByRole("button", { name: "buyNow" });

    await waitFor(() => expect(addToCart).toBeDisabled());
    expect(buyNow).toBeDisabled();
    expect(screen.getByTestId("admin-purchase-notice")).toHaveTextContent(
      "adminActionUnavailable",
    );
    expect(screen.queryByText("addToWishList")).not.toBeInTheDocument();
  });

  it("keeps customer purchasing controls enabled for a CUSTOMER", async () => {
    localStorage.setItem("id", "2");
    localStorage.setItem("role", "USER");

    render(<ProductInfo product={product} itemId={product.itemId} />);

    const addToCart = screen.getByRole("button", { name: "addToCart" });
    await waitFor(() => expect(addToCart).not.toBeDisabled());
    expect(screen.queryByTestId("admin-purchase-notice")).not.toBeInTheDocument();
  });
});
