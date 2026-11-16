"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { useLanguage } from "../../../context/LanguageContext";
import { useAppConfigContext } from "../../../context/AppConfigContext";
import {
  bulkUpdateSystemConfiguration,
  fetchConfigurationAudit,
  fetchSystemConfiguration,
  previewSystemConfiguration,
  resetAllSystemConfiguration,
  resetSystemConfiguration,
  updateClientVisibility,
  updateSystemConfiguration,
  validateSystemConfiguration,
} from "../services/systemConfigurationService";
import SettingControl from "./components/SettingControl";
import {
  AuditDialog,
  ConfirmDialog,
  PreviewDialog,
} from "./components/SystemSettingsDialogs";

const EMPTY_DATA = { categories: [], settings: [], viewer: null };

const DEFAULT_VIEWER = {
  internalAdmin: false,
  clientAdmin: false,
  globalClientAccessEnabled: false,
  globalClientEditingEnabled: false,
  canAccessSettings: false,
  canEditSettings: false,
  visibleSettingCount: 0,
};

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function deepEqual(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function extractValidationErrors(error) {
  const details = error?.response?.data?.error?.details;
  return details && typeof details === "object" && !Array.isArray(details)
    ? details
    : {};
}

function formatValue(value, sensitive) {
  if (sensitive) return "••••••••";
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function sourceLabel(source, isArabic) {
  switch (source) {
    case "DATABASE":
      return isArabic ? "تجاوز محفوظ" : "Stored override";
    case "INVALID_FALLBACK":
      return isArabic ? "قيمة مخزنة غير صالحة" : "Invalid stored value";
    default:
      return isArabic ? "القيمة الافتراضية" : "Developer default";
  }
}

function activationLabel(activation, isArabic) {
  switch (activation) {
    case "RESTART_REQUIRED":
      return isArabic ? "يتطلب إعادة تشغيل" : "Restart required";
    case "SUBSYSTEM_REFRESH":
      return isArabic ? "تحديث النظام الفرعي" : "Subsystem refresh";
    case "CACHE_REFRESH":
      return isArabic ? "تحديث الذاكرة المؤقتة" : "Cache refresh";
    default:
      return isArabic ? "فوري" : "Immediate";
  }
}

function constraintsSummary(definition, isArabic) {
  const constraints = definition.constraints || {};
  const parts = [];
  if (constraints.min !== null && constraints.min !== undefined) {
    parts.push(`${isArabic ? "الحد الأدنى" : "Min"}: ${constraints.min}`);
  }
  if (constraints.max !== null && constraints.max !== undefined) {
    parts.push(`${isArabic ? "الحد الأقصى" : "Max"}: ${constraints.max}`);
  }
  if (constraints.minLength) {
    parts.push(`${isArabic ? "أقل طول" : "Min length"}: ${constraints.minLength}`);
  }
  if (constraints.maxLength) {
    parts.push(`${isArabic ? "أقصى طول" : "Max length"}: ${constraints.maxLength}`);
  }
  if (constraints.pattern) {
    parts.push(`${isArabic ? "النمط" : "Pattern"}: ${constraints.pattern}`);
  }
  if (constraints.required) {
    parts.push(isArabic ? "مطلوب" : "Required");
  }
  if (constraints.nullable) {
    parts.push(isArabic ? "يمكن أن يكون فارغًا" : "Nullable");
  }
  if (definition.options?.length) {
    parts.push(
      `${isArabic ? "القيم المسموحة" : "Allowed"}: ${definition.options
        .map((option) => option.value)
        .join(", ")}`,
    );
  }
  return parts.join(" · ");
}

export default function SystemSettingsPage() {
  const { locale } = useLanguage();
  const isArabic = locale === "ar";
  const { refresh: refreshRuntimeConfig } = useAppConfigContext();

  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [visibilitySaving, setVisibilitySaving] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditRecords, setAuditRecords] = useState([]);
  const [pendingReset, setPendingReset] = useState(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [resetAllBusy, setResetAllBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSystemConfiguration();
      setData(result || EMPTY_DATA);
      setDrafts({});
      setValidationErrors({});
    } catch (loadError) {
      setError("LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const settings = useMemo(() => data.settings || [], [data.settings]);
  const categories = useMemo(() => data.categories || [], [data.categories]);
  const viewer = data.viewer || DEFAULT_VIEWER;
  const isInternalAdmin = viewer.internalAdmin === true;
  const editingAllowed = viewer.canEditSettings === true;
  const readOnly = !editingAllowed;

  const types = useMemo(
    () => Array.from(new Set(settings.map((setting) => setting.definition.type))).sort(),
    [settings],
  );

  const dirtySettings = useMemo(
    () =>
      settings.filter((setting) => {
        const draft = drafts[setting.definition.key];
        return draft && !deepEqual(draft.value, setting.value);
      }),
    [settings, drafts],
  );

  const hasUnsaved = dirtySettings.length > 0;

  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return settings.filter((setting) => {
      const definition = setting.definition;
      if (category !== "all" && definition.category !== category) return false;
      if (typeFilter !== "all" && definition.type !== typeFilter) return false;
      if (!query) return true;
      return [
        definition.key,
        definition.displayName,
        definition.displayNameAr,
        definition.description,
        definition.descriptionAr,
      ]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(query));
    });
  }, [settings, search, category, typeFilter]);

  const draftFor = (setting) => drafts[setting.definition.key];

  const handleChange = (setting, value) => {
    if (readOnly) return;
    const key = setting.definition.key;
    setDrafts((previous) => ({
      ...previous,
      [key]: {
        value,
        version: setting.overridden ? setting.storedVersion : 0,
      },
    }));
    setValidationErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const replaceSetting = (updated) => {
    setData((previous) => ({
      ...previous,
      settings: previous.settings.map((setting) =>
        setting.definition.key === updated.definition.key ? updated : setting,
      ),
    }));
  };

  const clearDraft = (key) => {
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleVisibilityChange = async (setting, visible) => {
    if (!isInternalAdmin) return;
    const key = setting.definition.key;
    setVisibilitySaving((previous) => ({ ...previous, [key]: true }));
    try {
      const updated = await updateClientVisibility(key, visible);
      replaceSetting(updated);
      toast.success(
        visible
          ? isArabic
            ? "أصبح الإعداد مرئيًا لمديري العملاء."
            : "Setting is now visible to client administrators."
          : isArabic
            ? "تم إخفاء الإعداد عن مديري العملاء."
            : "Setting is now hidden from client administrators.",
      );
    } catch {
      // The shared request helper displays the backend error.
    } finally {
      setVisibilitySaving((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = async (setting) => {
    if (readOnly) return;
    const key = setting.definition.key;
    const draft = drafts[key];
    if (!draft || deepEqual(draft.value, setting.value)) return;

    setSaving((previous) => ({ ...previous, [key]: true }));
    try {
      const updated = await updateSystemConfiguration(key, draft.value, draft.version);
      replaceSetting(updated);
      clearDraft(key);
      toast.success(isArabic ? "تم حفظ الإعداد." : "Setting saved.");
      refreshRuntimeConfig().catch(() => {});
    } catch (saveError) {
      const errors = extractValidationErrors(saveError);
      if (Object.keys(errors).length) {
        setValidationErrors((previous) => ({ ...previous, ...errors }));
      }
    } finally {
      setSaving((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const performReset = async (setting) => {
    if (readOnly) return;
    const key = setting.definition.key;
    setResetBusy(true);
    try {
      const updated = await resetSystemConfiguration(
        key,
        setting.overridden ? setting.storedVersion : undefined,
      );
      replaceSetting(updated);
      clearDraft(key);
      setPendingReset(null);
      toast.success(
        isArabic ? "تمت إعادة التعيين إلى القيمة الافتراضية." : "Reset to the default value.",
      );
      refreshRuntimeConfig().catch(() => {});
    } finally {
      setResetBusy(false);
    }
  };

  const handleValidate = async () => {
    if (readOnly) return;
    if (!dirtySettings.length) {
      toast.info(isArabic ? "لا توجد تغييرات للتحقق منها." : "There are no changes to validate.");
      return;
    }
    setValidating(true);
    try {
      const result = await validateSystemConfiguration(
        dirtySettings.map((setting) => ({
          key: setting.definition.key,
          value: drafts[setting.definition.key].value,
        })),
      );
      if (result?.valid) {
        setValidationErrors({});
        toast.success(isArabic ? "جميع القيم صالحة." : "All values are valid.");
      } else {
        const errors = Object.fromEntries(
          (result?.errors || []).map((item) => [item.key, item.message]),
        );
        setValidationErrors(errors);
        toast.error(isArabic ? "توجد قيم غير صالحة." : "Some values are invalid.");
      }
    } finally {
      setValidating(false);
    }
  };

  const handlePreview = async () => {
    if (readOnly) return;
    if (!dirtySettings.length) {
      toast.info(isArabic ? "لا توجد تغييرات للمعاينة." : "There are no changes to preview.");
      return;
    }
    try {
      const result = await previewSystemConfiguration(
        dirtySettings.map((setting) => ({
          key: setting.definition.key,
          value: drafts[setting.definition.key].value,
          version: drafts[setting.definition.key].version,
        })),
      );
      setPreview(result?.changes || []);
    } catch {
      // Error toast is handled by the shared request utility.
    }
  };

  const handleBulkSave = async () => {
    if (readOnly || !dirtySettings.length) return;
    setBulkSaving(true);
    try {
      const result = await bulkUpdateSystemConfiguration(
        dirtySettings.map((setting) => ({
          key: setting.definition.key,
          value: drafts[setting.definition.key].value,
          version: drafts[setting.definition.key].version,
        })),
      );
      setData(result || EMPTY_DATA);
      setDrafts({});
      setValidationErrors({});
      toast.success(isArabic ? "تم حفظ جميع التغييرات." : "All changes were saved.");
      refreshRuntimeConfig().catch(() => {});
    } catch (saveError) {
      const errors = extractValidationErrors(saveError);
      if (Object.keys(errors).length) {
        setValidationErrors((previous) => ({ ...previous, ...errors }));
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const openAudit = async () => {
    if (!isInternalAdmin) return;
    setAuditOpen(true);
    setAuditLoading(true);
    setAuditError("");
    try {
      const result = await fetchConfigurationAudit({ size: 50 });
      setAuditRecords(result?.content || []);
    } catch {
      setAuditError(
        isArabic
          ? "تعذر تحميل سجل التغييرات."
          : "The audit history could not be loaded.",
      );
    } finally {
      setAuditLoading(false);
    }
  };

  const handleResetAll = async () => {
    if (!isInternalAdmin) return;
    setResetAllBusy(true);
    try {
      const count = await resetAllSystemConfiguration();
      setConfirmResetAll(false);
      await load();
      toast.success(
        isArabic
          ? `تمت إعادة تعيين ${count} إعدادًا إلى القيم الافتراضية.`
          : `${count} settings were reset to their defaults.`,
      );
      refreshRuntimeConfig().catch(() => {});
    } finally {
      setResetAllBusy(false);
    }
  };

  const discardChanges = () => {
    setDrafts({});
    setValidationErrors({});
  };

  if (loading) {
    return (
      <div className="p-5" aria-busy="true">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">
            {isArabic
              ? "تعذر تحميل إعدادات النظام. تحقق من الاتصال وحاول مرة أخرى."
              : "System settings could not be loaded. Check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-lg bg-[#204272] px-4 py-2 text-sm font-semibold text-white hover:bg-[#19345a]"
          >
            {isArabic ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {isArabic ? "إعدادات النظام" : "System Settings"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            {isArabic
              ? "تحكم في سلوك التطبيق والميزات وواجهة المتجر لهذا التنصيب. القيم الافتراضية معرفة في الكود، والتجاوزات فقط هي التي تُحفظ."
              : "Control this installation's application behavior, features, and storefront UI. Defaults are defined in code; only explicit overrides are stored."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            {isArabic ? "تحديث" : "Refresh"}
          </button>
          {!readOnly ? (
            <>
              <button
                type="button"
                onClick={handleValidate}
                disabled={validating || !hasUnsaved}
                className="rounded-lg border border-[#204272] px-3 py-2 text-xs font-semibold text-[#204272] hover:bg-[#204272]/5 disabled:opacity-50"
              >
                {validating
                  ? isArabic
                    ? "جارٍ التحقق..."
                    : "Validating..."
                  : isArabic
                    ? "تحقق"
                    : "Validate"}
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={!hasUnsaved}
                className="rounded-lg border border-[#204272] px-3 py-2 text-xs font-semibold text-[#204272] hover:bg-[#204272]/5 disabled:opacity-50"
              >
                {isArabic ? "معاينة" : "Preview"}
              </button>
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={bulkSaving || !hasUnsaved}
                className="rounded-lg bg-[#204272] px-4 py-2 text-xs font-semibold text-white hover:bg-[#19345a] disabled:opacity-50"
              >
                {bulkSaving
                  ? isArabic
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isArabic
                    ? `حفظ التغييرات (${dirtySettings.length})`
                    : `Save changes (${dirtySettings.length})`}
              </button>
            </>
          ) : null}
          {isInternalAdmin ? (
            <>
              <button
                type="button"
                onClick={openAudit}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {isArabic ? "سجل التغييرات" : "Audit history"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetAll(true)}
                className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                {isArabic ? "إعادة تعيين الكل" : "Reset all"}
              </button>
            </>
          ) : null}
        </div>
      </header>

      {readOnly ? (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
        >
          <span className="font-semibold">
            {isArabic ? "وضع القراءة فقط" : "Read-only mode"}
          </span>
          <span>
            {isArabic
              ? "يمكنك عرض الإعدادات المسموح بها فقط. التعديل معطّل من مسؤول النظام."
              : "You can view the settings permitted for your account. Editing has been disabled by the system administrator."}
          </span>
        </div>
      ) : null}

      {hasUnsaved ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>
            {isArabic
              ? `لديك ${dirtySettings.length} تغييرًا غير محفوظ.`
              : `You have ${dirtySettings.length} unsaved change(s).`}
          </span>
          <button
            type="button"
            onClick={discardChanges}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
          >
            {isArabic ? "تجاهل التغييرات" : "Discard changes"}
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {isArabic ? "الفئات" : "Categories"}
            </p>
            <nav className="max-h-[70vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm ${
                  category === "all"
                    ? "bg-[#204272] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{isArabic ? "كل الفئات" : "All categories"}</span>
                <span className="text-xs opacity-80">{settings.length}</span>
              </button>
              {categories.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setCategory(item.code)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm ${
                    category === item.code
                      ? "bg-[#204272] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">
                    {isArabic ? item.displayNameAr || item.displayName : item.displayName}
                  </span>
                  <span className="text-xs opacity-80">{item.settingCount}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                isArabic
                  ? "ابحث بالاسم أو المفتاح أو الوصف..."
                  : "Search by name, key, or description..."
              }
              className="min-w-[220px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20"
              aria-label={isArabic ? "تصفية حسب النوع" : "Filter by type"}
            >
              <option value="all">{isArabic ? "كل الأنواع" : "All types"}</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {isArabic
              ? `عرض ${filteredSettings.length} من ${settings.length} إعدادًا`
              : `Showing ${filteredSettings.length} of ${settings.length} settings`}
          </p>

          {filteredSettings.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-gray-700">
                {isArabic ? "لا توجد إعدادات مطابقة." : "No matching settings."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setTypeFilter("all");
                }}
                className="mt-3 text-xs font-semibold text-[#204272] underline"
              >
                {isArabic ? "مسح الفلاتر" : "Clear filters"}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {filteredSettings.map((setting) => {
                const definition = setting.definition;
                const key = definition.key;
                const draft = draftFor(setting);
                const controlValue = draft ? draft.value : setting.value;
                const dirty = draft && !deepEqual(draft.value, setting.value);
                const disabled =
                  readOnly || !definition.editable || definition.readOnly;
                const isSaving = Boolean(saving[key]);
                const isVisibilitySaving = Boolean(visibilitySaving[key]);

                return (
                  <article
                    key={key}
                    className={`rounded-2xl border bg-white p-4 shadow-sm ${
                      dirty ? "border-amber-300" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900">
                          {isArabic
                            ? definition.displayNameAr || definition.displayName
                            : definition.displayName}
                        </h2>
                        <code className="mt-0.5 block break-all text-xs text-gray-500">
                          {key}
                        </code>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone="blue">{definition.type}</Badge>
                        {definition.featureFlag ? (
                          <Badge tone="purple">{isArabic ? "ميزة" : "Feature"}</Badge>
                        ) : null}
                        {definition.sensitive ? (
                          <Badge tone="amber">{isArabic ? "حساس" : "Sensitive"}</Badge>
                        ) : null}
                        {definition.readOnly ? (
                          <Badge tone="gray">{isArabic ? "للقراءة فقط" : "Read only"}</Badge>
                        ) : null}
                        {definition.experimental ? (
                          <Badge tone="amber">{isArabic ? "تجريبي" : "Experimental"}</Badge>
                        ) : null}
                        {definition.deprecated ? (
                          <Badge tone="red">{isArabic ? "مهجور" : "Deprecated"}</Badge>
                        ) : null}
                        {definition.requiresRestart ? (
                          <Badge tone="red">
                            {isArabic ? "يتطلب إعادة تشغيل" : "Restart required"}
                          </Badge>
                        ) : null}
                        {isInternalAdmin && setting.clientVisibilityConfigurable ? (
                          <Badge tone={setting.visibleToClientAdmins ? "green" : "gray"}>
                            {setting.visibleToClientAdmins
                              ? isArabic
                                ? "مرئي للعملاء"
                                : "Client visible"
                              : isArabic
                                ? "مخفي عن العملاء"
                                : "Client hidden"}
                          </Badge>
                        ) : null}
                        {isInternalAdmin && !setting.clientVisibilityConfigurable ? (
                          <Badge tone="gray">
                            {isArabic ? "داخلي فقط" : "Internal only"}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {isArabic
                        ? definition.descriptionAr || definition.description
                        : definition.description}
                    </p>

                    <dl className="mt-3 grid gap-3 rounded-xl bg-gray-50 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <Info
                        label={isArabic ? "القيمة الفعالة" : "Effective value"}
                        value={formatValue(setting.value, definition.sensitive)}
                      />
                      <Info
                        label={isArabic ? "القيمة الافتراضية" : "Default value"}
                        value={formatValue(definition.defaultValue, definition.sensitive)}
                      />
                      <Info
                        label={isArabic ? "المصدر" : "Source"}
                        value={sourceLabel(setting.source, isArabic)}
                      />
                      <Info
                        label={isArabic ? "التفعيل" : "Activation"}
                        value={activationLabel(definition.activation, isArabic)}
                      />
                    </dl>

                    {constraintsSummary(definition, isArabic) ? (
                      <p className="mt-2 text-xs text-gray-500">
                        {constraintsSummary(definition, isArabic)}
                      </p>
                    ) : null}

                    {isInternalAdmin ? (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700">
                            {isArabic
                              ? "مرئي لمديري العملاء"
                              : "Visible to client administrators"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {setting.clientVisibilityConfigurable
                              ? isArabic
                                ? "يظهر فقط عند تفعيل الوصول العام."
                                : "Shown only when global client access is enabled."
                              : isArabic
                                ? "هذا الإعداد خاص بالإدارة الداخلية ولا يمكن كشفه."
                                : "This control is internal-only and can never be exposed."}
                          </p>
                        </div>
                        {setting.clientVisibilityConfigurable ? (
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={Boolean(setting.visibleToClientAdmins)}
                              disabled={isVisibilitySaving}
                              onChange={(event) =>
                                handleVisibilityChange(setting, event.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-[#204272] focus:ring-[#204272]"
                            />
                            {isVisibilitySaving
                              ? isArabic
                                ? "جارٍ الحفظ..."
                                : "Saving..."
                              : isArabic
                                ? "مسموح"
                                : "Allowed"}
                          </label>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <SettingControl
                        definition={definition}
                        value={controlValue}
                        onChange={(value) => handleChange(setting, value)}
                        disabled={disabled}
                        locale={locale}
                        hasStoredValue={Boolean(setting.hasStoredValue || setting.overridden)}
                      />
                    </div>

                    {validationErrors[key] ? (
                      <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
                        {validationErrors[key]}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {!readOnly ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSave(setting)}
                            disabled={!dirty || isSaving || disabled}
                            className="rounded-lg bg-[#204272] px-3 py-2 text-xs font-semibold text-white hover:bg-[#19345a] disabled:opacity-40"
                          >
                            {isSaving
                              ? isArabic
                                ? "جارٍ الحفظ..."
                                : "Saving..."
                              : isArabic
                                ? "حفظ"
                                : "Save"}
                          </button>
                          {setting.overridden || setting.invalidStoredValue ? (
                            <button
                              type="button"
                              onClick={() => setPendingReset(setting)}
                              disabled={disabled}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            >
                              {isArabic ? "إعادة التعيين إلى الافتراضي" : "Reset to default"}
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <span className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">
                          {isArabic ? "للقراءة فقط" : "Read only"}
                        </span>
                      )}
                      {setting.source === "DATABASE" ? (
                        <span className="text-xs font-semibold text-[#204272]">
                          {isArabic ? "تجاوز محفوظ" : "Stored override"}
                        </span>
                      ) : null}
                      {setting.source === "INVALID_FALLBACK" ? (
                        <span className="text-xs font-semibold text-red-600">
                          {isArabic
                            ? "القيمة المخزنة غير صالحة؛ الافتراضي فعال"
                            : "Stored value is invalid; default is effective"}
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {preview ? (
        <PreviewDialog changes={preview} onClose={() => setPreview(null)} locale={locale} />
      ) : null}

      {auditOpen ? (
        <AuditDialog
          records={auditRecords}
          loading={auditLoading}
          error={auditError}
          onClose={() => setAuditOpen(false)}
          locale={locale}
        />
      ) : null}

      {pendingReset ? (
        <ConfirmDialog
          title={isArabic ? "إعادة التعيين إلى الافتراضي" : "Reset to default"}
          message={
            isArabic
              ? `سيتم حذف التجاوز المحفوظ للإعداد "${pendingReset.definition.key}" واستعادة القيمة الافتراضية.`
              : `The stored override for "${pendingReset.definition.key}" will be removed and the developer default restored.`
          }
          confirmLabel={isArabic ? "إعادة التعيين" : "Reset"}
          cancelLabel={isArabic ? "إلغاء" : "Cancel"}
          busy={resetBusy}
          onConfirm={() => performReset(pendingReset)}
          onCancel={() => setPendingReset(null)}
        />
      ) : null}

      {confirmResetAll ? (
        <ConfirmDialog
          title={isArabic ? "إعادة تعيين جميع التجاوزات" : "Reset all overrides"}
          message={
            isArabic
              ? "سيتم حذف جميع التجاوزات المحفوظة لهذا التنصيب واستعادة القيم الافتراضية. لا يمكن التراجع عن هذه العملية."
              : "Every stored override for this installation will be removed and developer defaults restored. This action cannot be undone."
          }
          confirmLabel={isArabic ? "إعادة تعيين الكل" : "Reset all"}
          cancelLabel={isArabic ? "إلغاء" : "Cancel"}
          busy={resetAllBusy}
          onConfirm={handleResetAll}
          onCancel={() => setConfirmResetAll(false)}
        />
      ) : null}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words text-gray-800">{value}</dd>
    </div>
  );
}

function Badge({ tone = "gray", children }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}
