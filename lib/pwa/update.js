/**
 * Service-worker update decisions. Updates are never applied automatically:
 * the user must accept them, and an in-flight checkout/payment operation
 * always wins over an update.
 */

export const UPDATE_APPLY_RESULT = {
  APPLYING: "applying",
  BLOCKED: "blocked",
  OFFLINE: "offline",
  UNAVAILABLE: "unavailable",
};

export function canApplyUpdate({ criticalOperation = false } = {}) {
  return !criticalOperation;
}

export function getUpdateApplyResult({
  hasWaitingWorker = false,
  criticalOperation = false,
  online = true,
} = {}) {
  if (!hasWaitingWorker) return UPDATE_APPLY_RESULT.UNAVAILABLE;
  if (!online) return UPDATE_APPLY_RESULT.OFFLINE;
  if (!canApplyUpdate({ criticalOperation })) return UPDATE_APPLY_RESULT.BLOCKED;
  return UPDATE_APPLY_RESULT.APPLYING;
}

export function shouldCheckForUpdate({
  online = true,
  visible = true,
  hasRegistration = true,
} = {}) {
  return Boolean(online && visible && hasRegistration);
}
