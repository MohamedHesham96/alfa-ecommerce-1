"use client";
import { useEffect, useMemo, useState } from "react";
import type { Column, Table } from "@tanstack/react-table";
import { MdFilterList } from "react-icons/md";
import { FaTimes } from "react-icons/fa";

import { useLanguage } from "../../../../context/LanguageContext.js";
import type {
  ColumnFilterValue,
  FilterOperator,
  TableDataType,
} from "../../types/table.types";

const UI_OPERATORS: FilterOperator[] = [
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "NOT_CONTAINS",
  "STARTS_WITH",
  "ENDS_WITH",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN",
  "LESS_THAN_OR_EQUAL",
  "BETWEEN",
  "IS_NULL",
  "IS_NOT_NULL",
];

const DEFAULT_OPERATORS: Record<TableDataType, FilterOperator[]> = {
  STRING: [
    "CONTAINS",
    "EQUALS",
    "NOT_EQUALS",
    "STARTS_WITH",
    "ENDS_WITH",
    "NOT_CONTAINS",
    "IS_NULL",
    "IS_NOT_NULL",
  ],
  NUMBER: [
    "EQUALS",
    "NOT_EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "BETWEEN",
    "IS_NULL",
    "IS_NOT_NULL",
  ],
  DATE: [
    "EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "BETWEEN",
    "IS_NULL",
    "IS_NOT_NULL",
  ],
  DATETIME: [
    "EQUALS",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "BETWEEN",
    "IS_NULL",
    "IS_NOT_NULL",
  ],
  BOOLEAN: ["EQUALS", "NOT_EQUALS", "IS_NULL", "IS_NOT_NULL"],
  ENUM: ["EQUALS", "NOT_EQUALS", "IS_NULL", "IS_NOT_NULL"],
};

function operatorsFor(meta: { dataType?: TableDataType; operators?: FilterOperator[] }) {
  const source = meta.operators?.length
    ? meta.operators
    : meta.dataType
      ? DEFAULT_OPERATORS[meta.dataType]
      : [];
  return source.filter((operator) => UI_OPERATORS.includes(operator));
}

function defaultOperator(meta: { dataType?: TableDataType; operators?: FilterOperator[] }) {
  const operators = operatorsFor(meta);
  return operators.includes("CONTAINS") ? "CONTAINS" : operators[0];
}

function isEmptyValue(value: unknown) {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.some((item) => item === "" || item === undefined);
  return false;
}

export function DataTableFilters<T>({ table }: { table: Table<T> }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const columns = useMemo(
    () =>
      table
        .getAllLeafColumns()
        .filter((column) => column.columnDef.meta?.filterable),
    [table],
  );

  const activeCount = columns.filter(
    (column) => column.getFilterValue() !== undefined,
  ).length;

  if (columns.length === 0) return null;

  return (
    <div className="admin-filter-anchor">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`admin-filter-button ${
          activeCount > 0 ? "admin-filter-button--active" : ""
        }`}
        aria-expanded={open}
      >
        <MdFilterList className="text-base" aria-hidden="true" />
        <span>{t("filters")}</span>
        {activeCount > 0 ? (
          <span className="admin-filter-count">{activeCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="admin-filter-panel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--admin-ink)]">{t("filters")}</h3>
              <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                {t("active_filters")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeCount > 0 ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--admin-danger-text)] hover:underline"
                  onClick={() => {
                    columns.forEach((column) => column.setFilterValue(undefined));
                  }}
                >
                  {t("clear_all")}
                </button>
              ) : null}
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pe-1">
            {columns.map((column) => (
              <FilterField key={column.id} column={column} t={t} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterField<T>({
  column,
  t,
}: {
  column: Column<T, unknown>;
  t: (key: string) => string;
}) {
  const meta = column.columnDef.meta ?? {};
  const operators = operatorsFor(meta);
  const rawValue = column.getFilterValue() as ColumnFilterValue | undefined;
  const [operator, setOperator] = useState<FilterOperator>(
    () => rawValue?.operator ?? defaultOperator(meta),
  );
  const value = rawValue?.value;

  useEffect(() => {
    if (rawValue?.operator) setOperator(rawValue.operator);
  }, [rawValue?.operator]);

  if (!meta.dataType || operators.length === 0) return null;

  const applyValue = (nextValue: unknown) => {
    if (operator === "IS_NULL" || operator === "IS_NOT_NULL") {
      column.setFilterValue({ operator, value: undefined });
      return;
    }
    if (isEmptyValue(nextValue)) {
      column.setFilterValue(undefined);
      return;
    }
    column.setFilterValue({ operator, value: nextValue });
  };

  const changeOperator = (nextOperator: FilterOperator) => {
    setOperator(nextOperator);
    if (nextOperator === "IS_NULL" || nextOperator === "IS_NOT_NULL") {
      column.setFilterValue({ operator: nextOperator, value: undefined });
      return;
    }
    const expectsArray =
      nextOperator === "BETWEEN" ||
      nextOperator === "IN" ||
      nextOperator === "NOT_IN";
    if (expectsArray !== Array.isArray(value)) {
      // Do not carry a scalar into BETWEEN or an array into a scalar operator.
      column.setFilterValue(undefined);
      return;
    }
    if (!isEmptyValue(value)) {
      column.setFilterValue({ operator: nextOperator, value });
      return;
    }
    // Keep the selected operator visible while the user enters values.
    column.setFilterValue(undefined);
  };

  return (
    <div className="admin-filter-field">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[var(--admin-ink-soft)]">
          {typeof column.columnDef.header === "string"
            ? column.columnDef.header
            : column.id}
        </span>
        {rawValue ? (
          <button
            type="button"
            className="text-[10px] font-bold text-[var(--admin-danger-text)]"
            onClick={() => column.setFilterValue(undefined)}
          >
            {t("clear")}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <select
          className="admin-select h-8 min-w-0 flex-1 !py-0 text-[11px]"
          value={operator}
          onChange={(event) => {
            const next = event.target.value as FilterOperator;
            changeOperator(next);
          }}
          aria-label={t("filters")}
        >
          {operators.map((item) => (
            <option key={item} value={item}>
              {t(`filter_operator_${item}`)}
            </option>
          ))}
        </select>
      </div>

      {operator !== "IS_NULL" && operator !== "IS_NOT_NULL" ? (
        <div className="mt-2">
          {operator === "BETWEEN" ? (
            <RangeInputs
              dataType={meta.dataType}
              value={Array.isArray(value) ? value : ["", ""]}
              onCommit={(next) => applyValue(next)}
            />
          ) : (
            <ValueInput
              dataType={meta.dataType}
              value={value}
              filterOptions={meta.filterOptions}
              onChange={(next) => applyValue(next)}
              t={t}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function ValueInput({
  dataType,
  value,
  filterOptions,
  onChange,
  t,
}: {
  dataType: TableDataType;
  value: unknown;
  filterOptions?: { label: string; value: string }[];
  onChange: (value: unknown) => void;
  t: (key: string) => string;
}) {
  const stringValue =
    value === undefined || value === null ? "" : String(value);

  if (dataType === "BOOLEAN") {
    return (
      <select
        className="admin-select h-8 !py-0 text-xs"
        value={stringValue}
        onChange={(event) =>
          onChange(event.target.value === "" ? "" : event.target.value === "true")
        }
      >
        <option value="">{t("all")}</option>
        <option value="true">{t("boolean_true")}</option>
        <option value="false">{t("boolean_false")}</option>
      </select>
    );
  }

  if (dataType === "ENUM") {
    return (
      <select
        className="admin-select h-8 !py-0 text-xs"
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("all")}</option>
        {(filterOptions ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={
        dataType === "NUMBER"
          ? "number"
          : dataType === "DATE"
            ? "date"
            : dataType === "DATETIME"
              ? "datetime-local"
              : "text"
      }
      className="admin-input h-8 !py-0 text-xs"
      value={stringValue}
      onChange={(event) => {
        const next = event.target.value;
        onChange(dataType === "NUMBER" && next !== "" ? Number(next) : next);
      }}
    />
  );
}

function RangeInputs({
  dataType,
  value,
  onCommit,
}: {
  dataType: TableDataType;
  value: unknown[];
  onCommit: (value: unknown[]) => void;
}) {
  const [from, setFrom] = useState(String(value[0] ?? ""));
  const [to, setTo] = useState(String(value[1] ?? ""));

  useEffect(() => {
    setFrom(String(value[0] ?? ""));
    setTo(String(value[1] ?? ""));
  }, [value]);

  const inputType =
    dataType === "NUMBER"
      ? "number"
      : dataType === "DATE"
        ? "date"
        : dataType === "DATETIME"
          ? "datetime-local"
          : "text";

  const commit = (nextFrom: string, nextTo: string) => {
    if (!nextFrom || !nextTo) return;
    onCommit([
      dataType === "NUMBER" ? Number(nextFrom) : nextFrom,
      dataType === "NUMBER" ? Number(nextTo) : nextTo,
    ]);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type={inputType}
        className="admin-input h-8 min-w-0 w-1/2 !py-0 text-xs"
        value={from}
        onChange={(event) => {
          setFrom(event.target.value);
          commit(event.target.value, to);
        }}
      />
      <span className="text-xs text-[var(--admin-muted-soft)]">-</span>
      <input
        type={inputType}
        className="admin-input h-8 min-w-0 w-1/2 !py-0 text-xs"
        value={to}
        onChange={(event) => {
          setTo(event.target.value);
          commit(from, event.target.value);
        }}
      />
    </div>
  );
}
