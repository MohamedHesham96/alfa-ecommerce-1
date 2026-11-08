import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, priority, ...props }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

jest.mock("../utils/requestsUtils", () => ({
  logoutRequest: jest.fn(),
}));

import { AppConfigProvider } from "../context/AppConfigContext";
import { LanguageProvider } from "../context/LanguageContext";
import { NamePageInAdminProvider } from "../context/namePageInAdmin";
import { resetAppConfigForTests } from "../lib/appConfigStore";
import PickupPlaceSelector from "../app/user/cart/components/PickupPlaceSelector";
import FulfillmentOptions from "../app/user/cart/components/FulfillmentOptions";
import SideMenu from "../app/admin/components/SideMenu";
import {
  buildOrderPayload,
  calculateCheckoutTotals,
  isPickupSelectionMissing,
} from "../app/user/cart/components/checkoutFulfillment";

const places = [
  {
    pickupPlaceId: 1,
    name: "Main Store",
    description: "Pickup from the main store",
    address: "45 Pickup Street",
    phone: "01000000000",
    workingHours: "9:00 AM - 9:00 PM",
    active: true,
  },
  {
    pickupPlaceId: 2,
    name: "Mall Kiosk",
    description: "Pickup from the mall kiosk",
    address: "Mall Road",
    phone: "01111111111",
    workingHours: "10:00 AM - 10:00 PM",
    active: true,
  },
];

function renderSelector(props = {}) {
  return render(
    <LanguageProvider>
      <PickupPlaceSelector places={places} onSelect={jest.fn()} {...props} />
    </LanguageProvider>,
  );
}

function renderMenu(config) {
  return render(
    <AppConfigProvider initialConfig={config}>
      <LanguageProvider>
        <NamePageInAdminProvider>
          <SideMenu />
        </NamePageInAdminProvider>
      </LanguageProvider>
    </AppConfigProvider>,
  );
}

describe("pickup checkout helpers", () => {
  it("builds delivery payloads without a pickup place", () => {
    expect(
      buildOrderPayload({
        paymentMethod: { value: "CASH_ON_DELIVERY" },
        fulfillmentType: "DELIVERY",
        pickupPlaceId: 7,
      }),
    ).toEqual({
      paymentMethod: "CASH_ON_DELIVERY",
      fulfillmentType: "DELIVERY",
      pickupPlaceId: null,
    });
  });

  it("builds pickup payloads with the selected location", () => {
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

  it("removes delivery fees for pickup while preserving delivery totals", () => {
    const delivery = calculateCheckoutTotals({
      total: 350,
      totalDiscount: 100,
      shippingCost: 300,
      netTotal: 650,
      fulfillmentType: "DELIVERY",
    });
    expect(delivery).toEqual({
      subtotal: 350,
      shippingCost: 300,
      netTotal: 650,
    });

    const pickup = calculateCheckoutTotals({
      total: 350,
      totalDiscount: 100,
      shippingCost: 300,
      netTotal: 650,
      fulfillmentType: "PICKUP",
    });
    expect(pickup).toEqual({
      subtotal: 350,
      shippingCost: 0,
      netTotal: 350,
    });
  });

  it("only requires a pickup place for enabled pickup checkouts", () => {
    expect(
      isPickupSelectionMissing({
        pickupEnabled: true,
        fulfillmentType: "PICKUP",
        pickupPlaceId: null,
      }),
    ).toBe(true);
    expect(
      isPickupSelectionMissing({
        pickupEnabled: true,
        fulfillmentType: "PICKUP",
        pickupPlaceId: 1,
      }),
    ).toBe(false);
    expect(
      isPickupSelectionMissing({
        pickupEnabled: true,
        fulfillmentType: "DELIVERY",
        pickupPlaceId: null,
      }),
    ).toBe(false);
    expect(
      isPickupSelectionMissing({
        pickupEnabled: false,
        fulfillmentType: "PICKUP",
        pickupPlaceId: null,
      }),
    ).toBe(false);
  });
});

describe("pickup place selector", () => {
  it("shows all location details and highlights the selected place", () => {
    renderSelector({ selectedId: 1 });

    expect(screen.getByText("Main Store")).toBeInTheDocument();
    expect(screen.getByText("Pickup from the main store")).toBeInTheDocument();
    expect(screen.getByText("45 Pickup Street")).toBeInTheDocument();
    expect(screen.getByText("01000000000")).toBeInTheDocument();
    expect(screen.getByText("9:00 AM - 9:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Mall Kiosk")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it("allows selecting exactly one location", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    renderSelector({ selectedId: null, onSelect });

    const radios = screen.getAllByRole("radio");
    await user.click(radios[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(places[1]);
  });

  it("shows an empty state when no active places are available", () => {
    renderSelector({ places: [] });
    expect(
      screen.getByText("لا توجد أماكن استلام نشطة حاليًا."),
    ).toBeInTheDocument();
  });

  it("asks guests to sign in before choosing a location", () => {
    renderSelector({ signedIn: false });
    expect(
      screen.getByText("سجّل الدخول لاختيار مكان الاستلام."),
    ).toBeInTheDocument();
  });
});

describe("checkout fulfillment options", () => {
  function renderOptions(props = {}) {
    return render(
      <LanguageProvider>
        <FulfillmentOptions
          pickupEnabled
          fulfillmentType="DELIVERY"
          onChange={jest.fn()}
          signedIn
          {...props}
        />
      </LanguageProvider>,
    );
  }

  it("is not rendered at all when pickup is disabled", () => {
    renderOptions({ pickupEnabled: false });
    expect(screen.queryByText("طريقة التسليم")).not.toBeInTheDocument();
    expect(screen.queryByText("التوصيل إلى المنزل")).not.toBeInTheDocument();
  });

  it("offers delivery and pickup when pickup is enabled", () => {
    renderOptions();
    expect(screen.getByText("طريقة التسليم")).toBeInTheDocument();
    expect(screen.getByText("التوصيل إلى المنزل")).toBeInTheDocument();
    expect(screen.getByText("الاستلام")).toBeInTheDocument();
  });

  it("shows active pickup places after choosing pickup", () => {
    renderOptions({ fulfillmentType: "PICKUP", pickupPlaces: places });
    expect(screen.getByText("Main Store")).toBeInTheDocument();
    expect(screen.getByText("Mall Kiosk")).toBeInTheDocument();
  });

  it("reports the chosen fulfillment type", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderOptions({ onChange });

    await user.click(screen.getByText("الاستلام"));
    expect(onChange).toHaveBeenCalledWith("PICKUP");
  });
});

describe("pickup admin navigation", () => {
  beforeEach(() => {
    resetAppConfigForTests();
    localStorage.clear();
  });

  it("hides the pickup places entry when the setting is disabled", () => {
    renderMenu({ "pickup.enabled": false });
    expect(screen.queryByText("أماكن الاستلام")).not.toBeInTheDocument();
  });

  it("shows the pickup places entry when the setting is enabled", async () => {
    renderMenu({ "pickup.enabled": true });
    const entry = await screen.findByText("أماكن الاستلام");
    expect(entry).toBeInTheDocument();
    expect(entry.closest("a")).toHaveAttribute("href", "/admin/PickupPlaces");
  });
});
