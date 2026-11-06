import {
  INSTALL_MODES,
  getInstallMode,
  isDismissalActive,
  isIosDevice,
  isIosSafari,
  isStandaloneMode,
  readDismissedAt,
  shouldOfferInstall,
  writeDismissedAt,
} from "../lib/pwa/install";

describe("PWA install helpers", () => {
  it("detects standalone launches", () => {
    const matchMedia = (query) => ({
      matches: query.includes("standalone"),
    });
    expect(isStandaloneMode({ matchMedia, navigator: {} })).toBe(true);
    expect(
      isStandaloneMode({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      }),
    ).toBe(true);
    expect(
      isStandaloneMode({
        matchMedia: () => ({ matches: false }),
        navigator: {},
      }),
    ).toBe(false);
  });

  it("detects iOS devices, including iPadOS desktop mode", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone)", "iPhone", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Macintosh)", "MacIntel", 5)).toBe(true);
    expect(isIosDevice("Mozilla/5.0 (Windows NT)", "Win32", 0)).toBe(false);
  });

  it("detects iOS Safari but not other iOS browsers", () => {
    expect(
      isIosSafari(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1",
        "iPhone",
        5,
      ),
    ).toBe(true);
    expect(
      isIosSafari(
        "Mozilla/5.0 (iPhone) CriOS/120.0 Mobile/15E148 Safari/604.1",
        "iPhone",
        5,
      ),
    ).toBe(false);
  });

  it("selects the correct install mode", () => {
    expect(
      getInstallMode({ isStandalone: true }),
    ).toBe(INSTALL_MODES.INSTALLED);
    expect(
      getInstallMode({ deferredPrompt: { prompt: jest.fn() } }),
    ).toBe(INSTALL_MODES.NATIVE);
    expect(
      getInstallMode({ isIosSafariBrowser: true }),
    ).toBe(INSTALL_MODES.IOS_INSTRUCTIONS);
    expect(getInstallMode({})).toBe(INSTALL_MODES.UNAVAILABLE);
  });

  it("honours the dismissal window", () => {
    const now = 10_000_000;
    expect(isDismissalActive(now - 1000, now, 5000)).toBe(true);
    expect(isDismissalActive(now - 6000, now, 5000)).toBe(false);
    expect(isDismissalActive(null, now, 5000)).toBe(false);
  });

  it("does not offer installation when installed, dismissed, or on a private page", () => {
    const base = {
      deferredPrompt: { prompt: jest.fn() },
      now: 10_000,
      dismissDurationMs: 5000,
      pathAllowed: true,
    };
    expect(shouldOfferInstall(base)).toBe(true);
    expect(shouldOfferInstall({ ...base, installed: true })).toBe(false);
    expect(shouldOfferInstall({ ...base, isStandalone: true })).toBe(false);
    expect(shouldOfferInstall({ ...base, pathAllowed: false })).toBe(false);
    expect(
      shouldOfferInstall({ ...base, dismissedAt: 8000 }),
    ).toBe(false);
    expect(shouldOfferInstall({})).toBe(false);
  });

  it("reads and writes dismissal timestamps defensively", () => {
    const storage = {
      value: null,
      getItem() {
        return this.value;
      },
      setItem(_key, value) {
        this.value = value;
      },
    };

    expect(writeDismissedAt(storage, "key", 1234)).toBe(true);
    expect(storage.value).toBe("1234");
    expect(readDismissedAt(storage, "key")).toBe(1234);

    storage.value = "not-a-number";
    expect(readDismissedAt(storage, "key")).toBeNull();
    expect(readDismissedAt(null, "key")).toBeNull();
  });
});
