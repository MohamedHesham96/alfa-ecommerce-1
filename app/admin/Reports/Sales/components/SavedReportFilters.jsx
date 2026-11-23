"use client";

import { MdBookmarkAdd, MdBookmarkBorder, MdDeleteOutline, MdStarOutline } from "react-icons/md";

import { useLanguage } from "../../../../../context/LanguageContext.js";

export default function SavedReportFilters({
  savedFilters,
  selectedId,
  onSelect,
  onLoad,
  onSaveCurrent,
  onUpdateSelected,
  onDeleteSelected,
  onSetDefault,
  busy,
}) {
  const { t } = useLanguage();
  const selected = savedFilters.find(
    (filter) => Number(filter.savedFilterId) === Number(selectedId),
  );

  return (
    <div className="sales-report-saved-filters">
      <div className="sales-report-saved-filter-select">
        <label className="admin-label" htmlFor="sales-report-saved-filter">
          {t("sales_report_saved_filters")}
        </label>
        <select
          id="sales-report-saved-filter"
          className="admin-select"
          value={selectedId ?? ""}
          onChange={(event) =>
            onSelect(event.target.value ? Number(event.target.value) : null)
          }
          disabled={busy}
        >
          <option value="">{t("sales_report_no_saved_filter_selected")}</option>
          {savedFilters.map((filter) => (
            <option
              key={filter.savedFilterId}
              value={filter.savedFilterId}
              disabled={!filter.valid}
            >
              {filter.name}
              {filter.defaultFilter ? ` — ${t("sales_report_default")}` : ""}
              {!filter.valid ? ` — ${t("sales_report_invalid_saved_filter")}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="sales-report-saved-filter-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={() => selected?.valid && onLoad(selected.filters)}
          disabled={!selected?.valid || busy}
        >
          <MdBookmarkBorder aria-hidden="true" />
          {t("sales_report_load_saved_filter")}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={onSaveCurrent}
          disabled={busy}
        >
          <MdBookmarkAdd aria-hidden="true" />
          {t("sales_report_save_current_filter")}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={onUpdateSelected}
          disabled={!selected || busy}
        >
          {t("sales_report_update_saved_filter")}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={onSetDefault}
          disabled={!selected?.valid || selected?.defaultFilter || busy}
        >
          <MdStarOutline aria-hidden="true" />
          {t("sales_report_set_default")}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger admin-btn-sm"
          onClick={onDeleteSelected}
          disabled={!selected || busy}
        >
          <MdDeleteOutline aria-hidden="true" />
          {t("sales_report_delete_saved_filter")}
        </button>
      </div>

      {selected && !selected.valid ? (
        <p className="sales-report-filter-error" role="status">
          {selected.validationError || t("sales_report_invalid_saved_filter_hint")}
        </p>
      ) : null}
    </div>
  );
}
