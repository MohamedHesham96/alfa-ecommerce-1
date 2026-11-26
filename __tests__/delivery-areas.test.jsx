import { render, screen } from "@testing-library/react";

import { LanguageProvider } from "../context/LanguageContext";
import {
  areaDisplayName,
  findAreaById,
  isAreaSelectionMissing,
  resolveAreaIdForAreas,
  resolveAreaShippingCost,
  shouldShowAreaSelector,
  toAreaOptions,
} from "../app/user/components/deliveryAreas";
import DeliveryAreaSelect from "../app/user/components/DeliveryAreaSelect";
import { buildOrderPayload } from "../app/user/cart/components/checkoutFulfillment";

const areas = [
  { areaId: 1, nameEn: "Nasr City", nameAr: "مدينة نصر", shippingCost: 45 },
  { areaId: 2, nameEn: "Maadi", nameAr: "المعادي", shippingCost: 60 },
];

function renderAreaSelect(props = {}) {
  return render(
    <LanguageProvider>
      <DeliveryAreaSelect areas={areas} value={1} onChange={jest.fn()} {...props} />
    </LanguageProvider>,
  );
}

describe("governorate area selection", () => {
  it("hides the area selector when the governorate has no areas", () => {
    const { container } = render(
      <LanguageProvider>
        <DeliveryAreaSelect areas={[]} value={null} onChange={jest.fn()} />
      </LanguageProvider>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(shouldShowAreaSelector([])).toBe(false);
    expect(shouldShowAreaSelector(areas)).toBe(true);
  });

  it("renders the area selector when areas exist", async () => {
    renderAreaSelect();
    expect(await screen.findByRole("combobox")).toBeInTheDocument();
  });

  it("requires an area only when the governorate has configured areas", () => {
    expect(isAreaSelectionMissing([], null)).toBe(false);
    expect(isAreaSelectionMissing(areas, null)).toBe(true);
    expect(isAreaSelectionMissing(areas, 1)).toBe(false);
  });

  it("never keeps an area from another governorate selected", () => {
    expect(resolveAreaIdForAreas(areas, 2)).toBe(2);
    expect(resolveAreaIdForAreas(areas, 999)).toBeNull();
    expect(findAreaById(areas, 1)?.nameEn).toBe("Nasr City");
    expect(findAreaById([], 1)).toBeNull();
  });

  it("uses the area fee when selected and preserves the fallback otherwise", () => {
    expect(resolveAreaShippingCost(areas, 1, 100)).toBe(45);
    expect(resolveAreaShippingCost(areas, 2, 100)).toBe(60);
    expect(resolveAreaShippingCost(areas, null, 100)).toBeNull();
    expect(resolveAreaShippingCost([], null, 100)).toBe(100);
  });

  it("localizes area names and maps combo-box options", () => {
    expect(areaDisplayName(areas[0], "en")).toBe("Nasr City");
    expect(areaDisplayName(areas[0], "ar")).toBe("مدينة نصر");
    expect(toAreaOptions(areas, "en")).toEqual([
      { value: 1, label: "Nasr City", shippingCost: 45 },
      { value: 2, label: "Maadi", shippingCost: 60 },
    ]);
  });

  it("never sends an area override from checkout", () => {
    expect(
      buildOrderPayload({
        paymentMethod: "CASH_ON_DELIVERY",
        fulfillmentType: "DELIVERY",
        addressId: 10,
      }),
    ).toEqual({
      paymentMethod: "CASH_ON_DELIVERY",
      fulfillmentType: "DELIVERY",
      pickupPlaceId: null,
      addressId: 10,
    });

    expect(
      buildOrderPayload({
        paymentMethod: "CASH_ON_DELIVERY",
        fulfillmentType: "PICKUP",
        pickupPlaceId: 7,
      }),
    ).toEqual({
      paymentMethod: "CASH_ON_DELIVERY",
      fulfillmentType: "PICKUP",
      pickupPlaceId: 7,
    });
  });
});
