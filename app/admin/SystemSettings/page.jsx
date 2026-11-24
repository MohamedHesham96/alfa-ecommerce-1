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
  uploadSystemConfigurationImage,
  validateSystemConfiguration,
} from "../services/systemConfigurationService";
import SettingControl from "./components/SettingControl";
import AdminLoading from "../components/AdminLoading";
import AdminPageHeader from "../components/ui/AdminPageHeader";
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

function groupTitle(settings, isArabic) {
  const named = settings.find(
    (setting) =>
      setting.definition.groupDisplayName ||
      setting.definition.groupDisplayNameAr,
  );
  if (named) {
    return isArabic
      ? named.definition.groupDisplayNameAr || named.definition.groupDisplayName
      : named.definition.groupDisplayName;
  }
  return settings[0]?.definition.displayName || "";
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
  const [imageUploading, setImageUploading] = useState({});
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
        definition.groupDisplayName,
        definition.groupDisplayNameAr,
      ]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(query));
    });
  }, [settings, search, category, typeFilter]);

  const settingBlocks = useMemo(() => {
    const blocks = [];
    const groupIndexes = new Map();
    filteredSettings.forEach((setting) => {
      const groupKey = setting.definition.groupKey;
      if (!groupKey) {
        blocks.push({
          key: setting.definition.key,
          settings: [setting],
        });
        return;
      }
      if (!groupIndexes.has(groupKey)) {
        groupIndexes.set(groupKey, blocks.length);
        blocks.push({
          key: `group:${groupKey}`,
          groupKey,
          settings: [],
        });
      }
      blocks[groupIndexes.get(groupKey)].settings.push(setting);
    });
    return blocks;
  }, [filteredSettings]);

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

  const handleImageUpload = async (setting, file) => {
    if (readOnly || !file) return;
    const key = setting.definition.key;
    setImageUploading((previous) => ({ ...previous, [key]: true }));
    setValidationErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });

    try {
      const updated = await uploadSystemConfigurationImage(
        key,
        file,
        setting.overridden ? setting.storedVersion : 0,
      );
      replaceSetting(updated);
      clearDraft(key);
      toast.success(isArabic ? "تم رفع الصورة." : "Image uploaded.");
      refreshRuntimeConfig().catch(() => {});
    } catch (uploadError) {
      const errors = extractValidationErrors(uploadError);
      if (Object.keys(errors).length) {
        setValidationErrors((previous) => ({ ...previous, ...errors }));
      }
    } finally {
      setImageUploading((previous) => {
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

  const handleGroupSave = async (groupSettings) => {
    if (readOnly) return;
    const updates = groupSettings
      .map((setting) => {
        const draft = drafts[setting.definition.key];
        if (!draft || deepEqual(draft.value, setting.value)) return null;
        return {
          key: setting.definition.key,
          value: draft.value,
          version: draft.version,
        };
      })
      .filter(Boolean);
    if (!updates.length) return;

    setBulkSaving(true);
    try {
      const result = await bulkUpdateSystemConfiguration(updates);
      setData(result || EMPTY_DATA);
      const savedKeys = new Set(updates.map((update) => update.key));
      setDrafts((previous) => {
        const next = { ...previous };
        savedKeys.forEach((key) => delete next[key]);
        return next;
      });
      setValidationErrors((previous) => {
        const next = { ...previous };
        savedKeys.forEach((key) => delete next[key]);
        return next;
      });
      toast.success(isArabic ? "تم حفظ الإعدادات." : "Settings saved.");
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

  const renderGroupMember = (setting) => {
    const definition = setting.definition;
    const key = definition.key;
    const draft = draftFor(setting);
    const controlValue = draft ? draft.value : setting.value;
    const dirty = draft && !deepEqual(draft.value, setting.value);
    const disabled = readOnly || !definition.editable || definition.readOnly;
    const isVisibilitySaving = Boolean(visibilitySaving[key]);
    const visibilityHint = setting.clientVisibilityConfigurable
      ? isArabic
        ? "يظهر فقط عند تفعيل الوصول العام لمديري العملاء."
        : "Shown only when global client access is enabled."
      : isArabic
        ? "هذا الإعداد خاص بالإدارة الداخلية ولا يمكن كشفه."
        : "This control is internal-only and can never be exposed.";

    return (
      <div
        key={key}
        className={`py-2.5 ${
          dirty
            ? "-mx-2 rounded-lg bg-[var(--admin-warning-soft)] px-2"
            : ""
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
          <div className="sm:w-56 sm:shrink-0">
            <p className="text-xs font-semibold text-[var(--admin-ink)]">
              {isArabic
                ? definition.displayNameAr || definition.displayName
                : definition.displayName}
            </p>
            {definition.description || definition.descriptionAr ? (
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--admin-muted)]">
                {isArabic
                  ? definition.descriptionAr || definition.description
                  : definition.description}
              </p>
            ) : null}
          </div>
          <div className="min-w-[180px] flex-1">
            <SettingControl
              definition={definition}
              value={controlValue}
              onChange={(value) => handleChange(setting, value)}
              disabled={disabled}
              locale={locale}
              hasStoredValue={Boolean(setting.hasStoredValue || setting.overridden)}
              onImageUpload={(file) => handleImageUpload(setting, file)}
              imageUploading={Boolean(imageUploading[key])}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {definition.featureFlag ? (
              <Badge tone="purple">{isArabic ? "ميزة" : "Feature"}</Badge>
            ) : null}
            {setting.overridden || setting.invalidStoredValue ? (
              <button
                type="button"
                onClick={() => setPendingReset(setting)}
                disabled={disabled}
                className="text-[11px] font-semibold text-[var(--admin-primary-hover)] underline disabled:opacity-50"
              >
                {isArabic ? "إعادة التعيين" : "Reset"}
              </button>
            ) : null}
          </div>
        </div>

        {isInternalAdmin ? (
          <label
            className="mt-1 flex w-fit items-center gap-2 text-[11px] font-semibold text-[var(--admin-ink-soft)]"
            title={visibilityHint}
          >
            <input
              type="checkbox"
              checked={Boolean(setting.visibleToClientAdmins)}
              disabled={isVisibilitySaving || !setting.clientVisibilityConfigurable}
              onChange={(event) =>
                handleVisibilityChange(setting, event.target.checked)
              }
              className="h-3.5 w-3.5 rounded border-[var(--admin-border-strong)] text-[var(--admin-primary-hover)] focus:ring-[var(--admin-primary-hover)]"
            />
            {isArabic ? "مرئي لمديري العملاء" : "Visible to client admins"}
          </label>
        ) : null}

        {validationErrors[key] ? (
          <p className="mt-1 text-[11px] font-semibold text-[var(--admin-danger)]" role="alert">
            {validationErrors[key]}
          </p>
        ) : null}
        {setting.source === "INVALID_FALLBACK" ? (
          <p className="mt-1 text-[11px] font-semibold text-[var(--admin-danger)]">
            {isArabic
              ? "القيمة المخزنة غير صالحة؛ الافتراضي فعال"
              : "Stored value is invalid; default is effective"}
          </p>
        ) : null}
      </div>
    );
  };

  const renderGroupCard = (block) => {
    const groupDirtyCount = block.settings.filter((setting) => {
      const draft = drafts[setting.definition.key];
      return draft && !deepEqual(draft.value, setting.value);
    }).length;

    return (
      <article key={block.key} className="admin-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--admin-ink)]">
                {groupTitle(block.settings, isArabic)}
              </h2>
              {groupDirtyCount ? (
                <Badge tone="amber">
                  {isArabic
                    ? `${groupDirtyCount} غير محفوظ`
                    : `${groupDirtyCount} unsaved`}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
              {isArabic
                ? "إعدادات مرتبطة تظهر معًا."
                : "Related settings shown together."}
            </p>
          </div>
          {!readOnly ? (
            <button
              type="button"
              onClick={() => handleGroupSave(block.settings)}
              disabled={!groupDirtyCount || bulkSaving}
              className="admin-btn admin-btn-primary admin-btn-xs"
            >
              {bulkSaving
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "حفظ"
                  : "Save"}
            </button>
          ) : (
            <span className="admin-badge admin-badge-blue">
              {isArabic ? "للقراءة فقط" : "Read only"}
            </span>
          )}
        </div>

        <div className="mt-1.5 divide-y divide-[var(--admin-border-subtle)]">
          {block.settings.map((setting) => renderGroupMember(setting))}
        </div>

        {!readOnly ? (
          <p className="mt-1.5 text-[11px] text-[var(--admin-muted)]">
            {isArabic
              ? "تُحفظ الحقول المعدّلة في هذا القسم معًا."
              : "Changed fields in this section are saved together."}
          </p>
        ) : null}
      </article>
    );
  };

  const renderSettingCard = (setting) => {
    const definition = setting.definition;
    const key = definition.key;
    const draft = draftFor(setting);
    const controlValue = draft ? draft.value : setting.value;
    const dirty = draft && !deepEqual(draft.value, setting.value);
    const disabled = readOnly || !definition.editable || definition.readOnly;
    const isSaving = Boolean(saving[key]);
    const isVisibilitySaving = Boolean(visibilitySaving[key]);
    const metadata = [
      {
        label: isArabic ? "القيمة الفعالة" : "Effective",
        value: formatValue(setting.value, definition.sensitive),
      },
      {
        label: isArabic ? "الافتراضي" : "Default",
        value: formatValue(definition.defaultValue, definition.sensitive),
      },
      {
        label: isArabic ? "المصدر" : "Source",
        value: sourceLabel(setting.source, isArabic),
      },
      {
        label: isArabic ? "التفعيل" : "Activation",
        value: activationLabel(definition.activation, isArabic),
      },
    ];
    const constraints = constraintsSummary(definition, isArabic);
    const visibilityHint = setting.clientVisibilityConfigurable
      ? isArabic
        ? "يظهر فقط عند تفعيل الوصول العام لمديري العملاء."
        : "Shown only when global client access is enabled."
      : isArabic
        ? "هذا الإعداد خاص بالإدارة الداخلية ولا يمكن كشفه."
        : "This control is internal-only and can never be exposed.";

    return (
      <article
        key={key}
        className={`admin-card p-3 ${
          dirty ? "!border-[var(--admin-warning-border)] !bg-[var(--admin-warning-soft)]" : ""
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="text-sm font-semibold text-[var(--admin-ink)]">
                {isArabic
                  ? definition.displayNameAr || definition.displayName
                  : definition.displayName}
              </h2>
              <code className="break-all text-[11px] text-[var(--admin-muted)]">
                {key}
              </code>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-[var(--admin-muted)]">
              {isArabic
                ? definition.descriptionAr || definition.description
                : definition.description}
            </p>
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
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="min-w-[200px] flex-1">
            <SettingControl
              definition={definition}
              value={controlValue}
              onChange={(value) => handleChange(setting, value)}
              disabled={disabled}
              locale={locale}
              hasStoredValue={Boolean(setting.hasStoredValue || setting.overridden)}
              onImageUpload={(file) => handleImageUpload(setting, file)}
              imageUploading={Boolean(imageUploading[key])}
            />
          </div>
          {!readOnly ? (
            <>
              <button
                type="button"
                onClick={() => handleSave(setting)}
                disabled={!dirty || isSaving || disabled}
                className="admin-btn admin-btn-primary admin-btn-xs"
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
                  className="admin-btn admin-btn-secondary admin-btn-xs"
                >
                  {isArabic ? "إعادة التعيين إلى الافتراضي" : "Reset to default"}
                </button>
              ) : null}
            </>
          ) : (
            <span className="admin-badge admin-badge-blue">
              {isArabic ? "للقراءة فقط" : "Read only"}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] leading-5 text-[var(--admin-muted)]">
          {metadata.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1">
              <span className="font-semibold">{item.label}:</span>
              <span className="text-[var(--admin-ink-soft)]">{item.value}</span>
            </span>
          ))}
          {constraints ? (
            <span className="basis-full text-[var(--admin-muted-soft)]">
              {constraints}
            </span>
          ) : null}
        </div>

        {isInternalAdmin ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border-subtle)] pt-2">
            <label
              className="flex items-center gap-2 text-[11px] font-semibold text-[var(--admin-ink-soft)]"
              title={visibilityHint}
            >
              <input
                type="checkbox"
                checked={Boolean(setting.visibleToClientAdmins)}
                disabled={isVisibilitySaving || !setting.clientVisibilityConfigurable}
                onChange={(event) =>
                  handleVisibilityChange(setting, event.target.checked)
                }
                className="h-3.5 w-3.5 rounded border-[var(--admin-border-strong)] text-[var(--admin-primary-hover)] focus:ring-[var(--admin-primary-hover)]"
              />
              {isVisibilitySaving
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isArabic
                  ? "مرئي لمديري العملاء"
                  : "Visible to client admins"}
            </label>
            {!setting.clientVisibilityConfigurable ? (
              <span className="text-[11px] text-[var(--admin-muted)]">
                {isArabic ? "داخلي فقط" : "Internal only"}
              </span>
            ) : null}
          </div>
        ) : null}

        {validationErrors[key] ? (
          <p className="mt-1 text-[11px] font-semibold text-[var(--admin-danger)]" role="alert">
            {validationErrors[key]}
          </p>
        ) : null}
      </article>
    );
  };

  if (loading) {
    return <AdminLoading rows={5} />;
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-card p-6 text-center">
          <p className="text-sm font-semibold text-[var(--admin-danger-text)]">
            {isArabic
              ? "تعذر تحميل إعدادات النظام. تحقق من الاتصال وحاول مرة أخرى."
              : "System settings could not be loaded. Check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={load}
            className="admin-btn admin-btn-primary mt-4"
          >
            {isArabic ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow={isArabic ? "الإدارة" : "Administration"}
        title={isArabic ? "إعدادات النظام" : "System Settings"}
        description={
          isArabic
            ? "تحكم في سلوك التطبيق والميزات وواجهة المتجر لهذا التنصيب. القيم الافتراضية معرفة في الكود، والتجاوزات فقط هي التي تُحفظ."
            : "Control this installation's application behavior, features, and storefront UI. Defaults are defined in code; only explicit overrides are stored."
        }
        actions={
          <>
            <button
              type="button"
              onClick={load}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              {isArabic ? "تحديث" : "Refresh"}
            </button>
            {!readOnly ? (
              <>
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={validating || !hasUnsaved}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
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
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {isArabic ? "معاينة" : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={handleBulkSave}
                  disabled={bulkSaving || !hasUnsaved}
                  className="admin-btn admin-btn-primary admin-btn-sm"
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
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  {isArabic ? "سجل التغييرات" : "Audit history"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetAll(true)}
                  className="admin-btn admin-btn-danger admin-btn-sm"
                >
                  {isArabic ? "إعادة تعيين الكل" : "Reset all"}
                </button>
              </>
            ) : null}
          </>
        }
      />

      {readOnly ? (
        <div
          role="status"
          className="admin-alert admin-alert-info"
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
        <div className="admin-alert admin-alert-warning justify-between">
          <span>
            {isArabic
              ? `لديك ${dirtySettings.length} تغييرًا غير محفوظ.`
              : `You have ${dirtySettings.length} unsaved change(s).`}
          </span>
          <button
            type="button"
            onClick={discardChanges}
            className="admin-btn admin-btn-secondary admin-btn-xs"
          >
            {isArabic ? "تجاهل التغييرات" : "Discard changes"}
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="admin-card p-2">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-[var(--admin-muted)]">
              {isArabic ? "الفئات" : "Categories"}
            </p>
            <nav className="max-h-[70vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors ${
                  category === "all"
                    ? "bg-[var(--admin-accent-solid)] font-semibold text-[var(--admin-on-accent)]"
                    : "text-[var(--admin-ink-soft)] hover:bg-[var(--admin-canvas)]"
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
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors ${
                    category === item.code
                      ? "bg-[var(--admin-accent-solid)] font-semibold text-[var(--admin-on-accent)]"
                      : "text-[var(--admin-ink-soft)] hover:bg-[var(--admin-canvas)]"
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
          <div className="admin-toolbar !flex-row !flex-wrap !items-center">
            <label className="admin-search !flex-1">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={
                  isArabic
                    ? "ابحث بالاسم أو المفتاح أو الوصف"
                    : "Search by name, key, or description"
                }
                placeholder={
                  isArabic
                    ? "ابحث بالاسم أو المفتاح أو الوصف..."
                    : "Search by name, key, or description..."
                }
              />
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="admin-select !w-auto min-w-[150px]"
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

          <p className="mt-3 text-xs text-[var(--admin-muted)]">
            {isArabic
              ? `عرض ${filteredSettings.length} من ${settings.length} إعدادًا`
              : `Showing ${filteredSettings.length} of ${settings.length} settings`}
          </p>

          {filteredSettings.length === 0 ? (
            <div className="admin-card mt-4 p-10 text-center">
              <p className="text-sm font-semibold text-[var(--admin-ink-soft)]">
                {isArabic ? "لا توجد إعدادات مطابقة." : "No matching settings."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setTypeFilter("all");
                }}
                className="mt-3 text-xs font-semibold text-[var(--admin-danger-text)] underline"
              >
                {isArabic ? "مسح الفلاتر" : "Clear filters"}
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {settingBlocks.map((block) => {
                if (block.groupKey) {
                  return renderGroupCard(block);
                }
                return renderSettingCard(block.settings[0]);
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

function Badge({ tone = "gray", children }) {
  const tones = {
    blue: "admin-badge-blue",
    purple: "admin-badge-purple",
    amber: "admin-badge-amber",
    red: "admin-badge-red",
    green: "admin-badge-green",
    gray: "admin-badge-gray",
  };
  return (
    <span className={`admin-badge ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}
