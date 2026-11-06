/**
 * Tracks checkout/payment-style operations that must not be interrupted by a
 * service-worker activation or a page reload.
 */

let activeOperations = 0;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function beginCriticalOperation() {
  activeOperations += 1;
  emit();

  let released = false;
  return function releaseCriticalOperation() {
    if (released) return;
    released = true;
    activeOperations = Math.max(0, activeOperations - 1);
    emit();
  };
}

export function isCriticalOperationInProgress() {
  return activeOperations > 0;
}

export function getCriticalOperationSnapshot() {
  return activeOperations > 0;
}

export function subscribeCriticalOperations(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetCriticalOperationsForTests() {
  activeOperations = 0;
  emit();
}
