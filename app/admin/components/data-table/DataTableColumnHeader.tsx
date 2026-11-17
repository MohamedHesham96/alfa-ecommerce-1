"use client";
import type { Column } from "@tanstack/react-table";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import type { ReactNode } from "react";

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
  if (!column.getCanSort() || column.columnDef.meta?.sortable !== true) {
    return <span className={`inline-flex items-center ${className}`}>{title}</span>;
  }

  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={`group inline-flex items-center gap-1.5 font-bold text-[#475467] transition-colors hover:text-[#101828] ${className}`}
      title="Shift + click to sort by multiple columns"
    >
      <span>{title}</span>
      <span className="text-[10px] text-[#98a2b3] group-hover:text-[#667085]">
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
