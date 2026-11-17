"use client";
import Link from "next/link";
import { useLanguage } from "../../../../../context/LanguageContext";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";

const getPaginationItems = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index);
  }
  const middle = [current - 1, current, current + 1];
  const items = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || middle.includes(i)) {
      items.push(i);
    } else if (items[items.length - 1] !== "...") {
      items.push("...");
    }
  }
  return items;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  buildHref,
}) {
  const { t, locale } = useLanguage();
  const isRTL = locale === "ar";
  const items = getPaginationItems(currentPage, totalPages);
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  const baseBtn =
    "flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-xl text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-300";

  const navBtn =
    "border border-gray-200 bg-white text-gray-600 hover:border-red-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600";

  const isLinkMode = typeof buildHref === "function";

  const pageControl = (page, content, active = false, disabled = false, ariaLabel) => {
    if (isLinkMode && !disabled) {
      return (
        <Link
          key={`page-${page}`}
          href={buildHref(page)}
          aria-current={active ? "page" : undefined}
          aria-label={ariaLabel}
          className={`${baseBtn} ${
            active ? "bg-red-500 text-white shadow-sm hover:bg-red-600" : navBtn
          }`}
        >
          {content}
        </Link>
      );
    }

    if (isLinkMode && disabled) {
      return (
        <span
          key={`page-${page}`}
          aria-disabled="true"
          aria-label={ariaLabel}
          className={`${baseBtn} ${navBtn} cursor-not-allowed opacity-40`}
        >
          {content}
        </span>
      );
    }

    return (
      <button
        key={`page-${page}`}
        type="button"
        aria-current={active ? "page" : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onPageChange(page)}
        className={`${baseBtn} ${
          active ? "bg-red-500 text-white shadow-sm hover:bg-red-600" : navBtn
        }`}
      >
        {content}
      </button>
    );
  };

  const previousIcon = isRTL ? (
    <IoChevronForwardOutline className="w-4 h-4 sm:w-5 sm:h-5" />
  ) : (
    <IoChevronBackOutline className="w-4 h-4 sm:w-5 sm:h-5" />
  );
  const nextIcon = isRTL ? (
    <IoChevronBackOutline className="w-4 h-4 sm:w-5 sm:h-5" />
  ) : (
    <IoChevronForwardOutline className="w-4 h-4 sm:w-5 sm:h-5" />
  );

  return (
    <nav aria-label={t("pagination")} className="mt-8 flex w-full justify-center">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        {pageControl(
          currentPage - 1,
          previousIcon,
          false,
          isFirst,
          t("previous"),
        )}

        {items.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-6 w-6 select-none items-center justify-center text-sm text-gray-400 sm:h-10 sm:w-8"
            >
              ...
            </span>
          ) : (
            pageControl(item, item + 1, item === currentPage)
          ),
        )}

        {pageControl(
          currentPage + 1,
          nextIcon,
          false,
          isLast,
          t("next"),
        )}
      </div>
    </nav>
  );
}
