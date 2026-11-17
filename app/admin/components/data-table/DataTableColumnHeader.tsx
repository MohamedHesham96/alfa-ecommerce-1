"use client";
import type { Column } from "@tanstack/react-table";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import type { ReactNode } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";

interface DataTableColumnHeaderProps<T> {
  column: Column<T, unknown>;
  title: ReactNode;
  className?: string;
}

export function DataTableColumnHeader<T>({
  column,
  title,
  className = "",
}: DataTableColumnHeaderProps<T>) {
  const { t } = useLanguage();
  if (!column.getCanSort() || column.columnDef.meta?.sortable !== true) {
    return <span className={`inline-flex items-center ${className}`}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={`group inline-flex items-center gap-1.5 font-bold text-[var(--admin-ink-soft)] transition-colors hover:text-[var(--admin-ink)] ${className}`}
      title={t("sort_multiple_columns")}
    >
      <span>{title}</span>
      <span className="text-[10px] text-[var(--admin-muted-soft)] group-hover:text-[var(--admin-muted)]">
        {sorted === "asc" ? (
          <FaSortUp />
        ) : sorted === "desc" ? (
          <FaSortDown />
        ) : (
          <FaSort />
        )}
      </span>
    </button>
  );
}
