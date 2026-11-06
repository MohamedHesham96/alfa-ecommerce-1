import {
  UPDATE_APPLY_RESULT,
  canApplyUpdate,
  getUpdateApplyResult,
  shouldCheckForUpdate,
} from "../lib/pwa/update";
import {
  beginCriticalOperation,
  getCriticalOperationSnapshot,
  isCriticalOperationInProgress,
  resetCriticalOperationsForTests,
  subscribeCriticalOperations,
} from "../lib/pwa/criticalOperation";

describe("PWA update decisions", () => {
  beforeEach(() => {
    resetCriticalOperationsForTests();
  });

  it("blocks updates while a checkout is in flight", () => {
    expect(canApplyUpdate({ criticalOperation: false })).toBe(true);
    expect(canApplyUpdate({ criticalOperation: true })).toBe(false);

    expect(
      getUpdateApplyResult({ hasWaitingWorker: true, criticalOperation: false }),
    ).toBe(UPDATE_APPLY_RESULT.APPLYING);
    expect(
      getUpdateApplyResult({ hasWaitingWorker: true, criticalOperation: true }),
    ).toBe(UPDATE_APPLY_RESULT.BLOCKED);
    expect(
      getUpdateApplyResult({ hasWaitingWorker: true, online: false }),
    ).toBe(UPDATE_APPLY_RESULT.OFFLINE);
    expect(getUpdateApplyResult({ hasWaitingWorker: false })).toBe(
      UPDATE_APPLY_RESULT.UNAVAILABLE,
    );
  });

  it("tracks critical operations through the shared registry", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCriticalOperations(listener);

    expect(isCriticalOperationInProgress()).toBe(false);
    const release = beginCriticalOperation("checkout");
    expect(isCriticalOperationInProgress()).toBe(true);
    expect(getCriticalOperationSnapshot()).toBe(true);

    release();
    release();
    expect(isCriticalOperationInProgress()).toBe(false);
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });

  it("checks for updates only when online and visible", () => {
    expect(shouldCheckForUpdate({ online: true, visible: true })).toBe(true);
    expect(shouldCheckForUpdate({ online: false, visible: true })).toBe(false);
    expect(shouldCheckForUpdate({ online: true, visible: false })).toBe(false);
    expect(shouldCheckForUpdate({ hasRegistration: false })).toBe(false);
  });
});
