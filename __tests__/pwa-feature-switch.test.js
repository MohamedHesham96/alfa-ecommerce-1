describe("PWA feature switch", () => {
  const originalValue = process.env.NEXT_PUBLIC_ENABLE_PWA;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_PWA;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_PWA = originalValue;
    }
    jest.resetModules();
  });

  it("is enabled when NEXT_PUBLIC_ENABLE_PWA is absent", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_PWA;
    jest.resetModules();

    const { isPwaEnabled } = require("../lib/pwa/constants");
    expect(isPwaEnabled).toBe(true);
  });

  it("is disabled only when NEXT_PUBLIC_ENABLE_PWA is the exact string false", () => {
    process.env.NEXT_PUBLIC_ENABLE_PWA = "false";
    jest.resetModules();

    const { isPwaEnabled } = require("../lib/pwa/constants");
    expect(isPwaEnabled).toBe(false);
  });

  it("stays enabled when NEXT_PUBLIC_ENABLE_PWA is true", () => {
    process.env.NEXT_PUBLIC_ENABLE_PWA = "true";
    jest.resetModules();

    const { isPwaEnabled } = require("../lib/pwa/constants");
    expect(isPwaEnabled).toBe(true);
  });
});
