import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../../utils/requestsUtils";

const BASE_PATH = "/api/admin/system-configuration";

export async function fetchSystemConfiguration() {
  const response = await getRequest(`${BASE_PATH}/settings`);
  return response.data;
}

export async function fetchConfigurationOverrides() {
  const response = await getRequest(`${BASE_PATH}/overrides`);
  return response.data;
}

export async function fetchConfigurationAudit({ key, from, to, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams();
  if (key) params.set("key", key);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("page", String(page));
  params.set("size", String(size));
  const response = await getRequest(`${BASE_PATH}/audit?${params.toString()}`);
  return response.data;
}

export async function updateSystemConfiguration(key, value, version) {
  const response = await putRequest(
    `${BASE_PATH}/settings/${encodeURIComponent(key)}`,
    { value, version },
    "",
  );
  return response.data;
}

export async function bulkUpdateSystemConfiguration(updates, reason) {
  const response = await postRequest(
    `${BASE_PATH}/settings/bulk`,
    { updates, reason },
    "",
  );
  return response.data;
}

export async function resetSystemConfiguration(key, version) {
  const query =
    version !== null && version !== undefined
      ? `?version=${encodeURIComponent(version)}`
      : "";
  const response = await deleteRequest(
    `${BASE_PATH}/settings/${encodeURIComponent(key)}${query}`,
    "",
    { skipConfirm: true },
  );
  return response.data;
}

export async function resetAllSystemConfiguration() {
  const response = await postRequest(
    `${BASE_PATH}/settings/reset-all`,
    { confirm: true },
    "",
  );
  return response.data;
}

export async function validateSystemConfiguration(updates) {
  const response = await postRequest(
    `${BASE_PATH}/validate`,
    { updates },
    "",
  );
  return response.data;
}

export async function previewSystemConfiguration(updates, resets = []) {
  const response = await postRequest(
    `${BASE_PATH}/preview`,
    { updates, resets },
    "",
  );
  return response.data;
}
