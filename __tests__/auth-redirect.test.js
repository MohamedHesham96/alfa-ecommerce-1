import {
  buildSignInUrl,
  getCurrentRelativeUrl,
  getReturnUrlFromLocation,
  getReturnUrlFromSearch,
  sanitizeReturnUrl,
} from "../utils/authRedirect";

const ORIGIN = "http://localhost";

describe("auth redirect URL safety", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("accepts internal paths with query parameters and a hash", () => {
    expect(
      sanitizeReturnUrl(
        "/admin/orders/OrdersDetails/42?tab=items#timeline",
        ORIGIN,
      ),
    ).toBe("/admin/orders/OrdersDetails/42?tab=items#timeline");
  });

  it.each([
    ["absolute external URL", "https://evil.example/order/42"],
    ["protocol-relative URL", "//evil.example/order/42"],
    ["backslash URL", "/\\evil.example/order/42"],
    ["encoded protocol-relative URL", "/%2F%2Fevil.example/order/42"],
    ["encoded double slash", "/admin/orders%2F%2Fevil.example"],
    ["encoded traversal", "/admin/%2e%2e/signin"],
    ["encoded traversal with slash", "/admin/orders%2F..%2F..%2Fsignin"],
    ["sign-in loop", "/signin?returnUrl=%2Fadmin"],
    ["API path", "/api/admin/orders/42"],
    ["static asset", "/images/logo.png"],
    ["control characters", "/admin/%0d%0aLocation:%20https://evil.example"],
    ["oversized URL", `/admin/${"a".repeat(4100)}`],
  ])("rejects %s", (_label, value) => {
    expect(sanitizeReturnUrl(value, ORIGIN)).toBeNull();
  });

  it("reads the canonical returnUrl parameter", () => {
    const search =
      "?returnUrl=%2Fadmin%2Forders%2FOrdersDetails%2F42%3Ftab%3Ditems%23timeline";

    expect(getReturnUrlFromSearch(search, ORIGIN)).toBe(
      "/admin/orders/OrdersDetails/42?tab=items#timeline",
    );
  });

  it("supports redirectUrl and next aliases", () => {
    expect(
      getReturnUrlFromSearch(
        "?redirectUrl=%2Fuser%2Forderdetails%2F7",
        ORIGIN,
      ),
    ).toBe("/user/orderdetails/7");
    expect(getReturnUrlFromSearch("?next=%2Fuser%2Fordershistory", ORIGIN)).toBe(
      "/user/ordershistory",
    );
  });

  it("ignores an unsafe returnUrl instead of redirecting externally", () => {
    expect(
      getReturnUrlFromSearch(
        "?returnUrl=https%3A%2F%2Fevil.example%2Forder%2F42",
        ORIGIN,
      ),
    ).toBeNull();
  });

  it("builds an encoded sign-in URL and keeps root login unchanged", () => {
    expect(
      buildSignInUrl("/admin/orders/OrdersDetails/42?tab=items", ORIGIN),
    ).toBe(
      "/signin?returnUrl=%2Fadmin%2Forders%2FOrdersDetails%2F42%3Ftab%3Ditems",
    );
    expect(buildSignInUrl("/", ORIGIN)).toBe("/signin");
    expect(buildSignInUrl("https://evil.example", ORIGIN)).toBe("/signin");
  });

  it("reads the return URL and full current location from the browser", () => {
    window.history.replaceState(
      {},
      "",
      "/signin?returnUrl=%2Fuser%2Forderdetails%2F7%3Fsource%3Demail%23items",
    );

    expect(getReturnUrlFromLocation()).toBe(
      "/user/orderdetails/7?source=email#items",
    );
    expect(getCurrentRelativeUrl()).toBe(
      "/signin?returnUrl=%2Fuser%2Forderdetails%2F7%3Fsource%3Demail%23items",
    );
  });
});
