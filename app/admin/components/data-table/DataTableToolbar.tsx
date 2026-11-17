"use client";
import type { ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { IoMdSearch } from "react-icons/io";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { DataTableFilters } from "./DataTableFilters";

interface DataTableToolbarProps<T> {
  table: Table<T>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DataTableToolbar<T>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  leading,
  actions,
  className = "",
}: DataTableToolbarProps<T>) {
  const { t } = useLanguage();

  return (
    <div className={`admin-toolbar ${className}`}>
      <div className="admin-toolbar-main">
        <label className="admin-search">
          <IoMdSearch className="admin-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder ?? t("search")}
            aria-label={searchPlaceholder ?? t("search")}
          />
        </label>
        {leading}
        <DataTableFilters table={table} />
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
