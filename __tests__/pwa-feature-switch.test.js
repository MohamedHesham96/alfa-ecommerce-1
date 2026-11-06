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

  it("is disabled when NEXT_PUBLIC_ENABLE_PWA is absent", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_PWA;
    jest.resetModules();

    const { isPwaEnabled } = require("../lib/pwa/constants");
    expect(isPwaEnabled).toBe(false);
  });

  it("is disabled for any value other than the exact string true", () => {
    process.env.NEXT_PUBLIC_ENABLE_PWA = "false";
    jest.resetModules();

    const { isPwaEnabled } = require("../lib/pwa/constants");
    expect(isPwaEnabled).toBe(false);
  });

  it("is enabled only when NEXT_PUBLIC_ENABLE_PWA is true", () => {
    process.env.NEXT_PUBLIC_ENABLE_PWA = "true";
    jest.resetModules();

    const { isPwaEnabled } = require("../lib/pwa/constants");
    expect(isPwaEnabled).toBe(true);
  });
});
