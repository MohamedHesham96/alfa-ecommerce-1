import { render, screen, waitFor } from "@testing-library/react";

import ProductsByCategoryPopup from "../app/admin/Categories/components/ProductsByCategoryPopup";
import { LanguageProvider } from "../context/LanguageContext";

jest.mock("../app/admin/Products/components/ProductsTable", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../app/admin/Products/components/ProductForm", () => ({
  __esModule: true,
  default: () => null,
}));

const category = {
  itemCategoryId: 3,
  nameAr: "كسسوارات ريسيفر",
  nameEn: "Receiver Accessories",
};

function renderPopup() {
  return render(
    <LanguageProvider>
      <ProductsByCategoryPopup
        category={category}
        popupShow
        setPopupShow={jest.fn()}
      />
    </LanguageProvider>,
  );
}

describe("ProductsByCategoryPopup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the Arabic category name for Arabic admins", async () => {
    renderPopup();

    expect(
      await screen.findByRole("heading", { name: category.nameAr }),
    ).toBeInTheDocument();
  });

  it("shows the English category name for English admins", async () => {
    localStorage.setItem("lang", "en");
    renderPopup();

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: category.nameEn }),
      ).toBeInTheDocument(),
    );
  });
});
