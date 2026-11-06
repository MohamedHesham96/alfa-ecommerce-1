import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSlideNext = jest.fn();
const mockSlidePrev = jest.fn();
let mockLocale = "en";

jest.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    locale: mockLocale,
    t: (key) => key,
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, quality, priority, sizes, ...props }) => {
    const React = require("react");
    return React.createElement("img", {
      ...props,
      src: props.src || "/placeholder.png",
    });
  },
}));

jest.mock("../app/user/components/ProductCard", () => ({
  __esModule: true,
  default: () => <div data-testid="product-card" />,
}));

jest.mock("swiper/css", () => ({}));
jest.mock("swiper/css/navigation", () => ({}));
jest.mock("swiper/css/pagination", () => ({}));

jest.mock("swiper/modules", () => ({
  Autoplay: {},
  Navigation: {},
  Pagination: {},
}));

jest.mock("swiper/react", () => {
  const React = require("react");
  return {
    Swiper: ({ children, onSwiper }) => {
      React.useEffect(() => {
        onSwiper?.({
          slideNext: mockSlideNext,
          slidePrev: mockSlidePrev,
        });
      }, [onSwiper]);

      return <div data-testid="swiper">{children}</div>;
    },
    SwiperSlide: ({ children }) => <div>{children}</div>,
  };
});

import TopDiscounted from "../app/user/home/components/TopDiscounted";

const products = [
  { itemId: 1, name: "Product one" },
  { itemId: 2, name: "Product two" },
];

describe("TopDiscounted carousel navigation", () => {
  beforeEach(() => {
    mockSlideNext.mockClear();
    mockSlidePrev.mockClear();
  });

  it("maps the LTR arrows to previous and next products", async () => {
    mockLocale = "en";
    const user = userEvent.setup();

    render(<TopDiscounted Products={products} />);

    await user.click(
      screen.getByRole("button", { name: "Previous products" }),
    );
    expect(mockSlidePrev).toHaveBeenCalledTimes(1);
    expect(mockSlideNext).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Next products" }));
    expect(mockSlideNext).toHaveBeenCalledTimes(1);
    expect(mockSlidePrev).toHaveBeenCalledTimes(1);
  });

  it("maps the RTL arrows to next and previous products", async () => {
    mockLocale = "ar";
    const user = userEvent.setup();

    render(<TopDiscounted Products={products} />);

    // In RTL the next products are visually on the left.
    await user.click(
      screen.getByRole("button", { name: "المنتجات التالية" }),
    );
    expect(mockSlideNext).toHaveBeenCalledTimes(1);
    expect(mockSlidePrev).not.toHaveBeenCalled();

    // In RTL the previous products are visually on the right.
    await user.click(
      screen.getByRole("button", { name: "المنتجات السابقة" }),
    );
    expect(mockSlidePrev).toHaveBeenCalledTimes(1);
    expect(mockSlideNext).toHaveBeenCalledTimes(1);
  });
});
