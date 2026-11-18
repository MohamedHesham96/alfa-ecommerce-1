"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdImageNotSupported } from "react-icons/md";

import { productPath } from "../../../../lib/seo";
import { getThumbnailUrl } from "../../../../utils/functions";
import InfoTip from "./InfoTip";
import SectionEmpty from "./SectionEmpty";

function ProductThumb({ imageUrl, name }) {
  const [failed, setFailed] = useState(false);
  const src =
    imageUrl && !failed
      ? `${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(imageUrl)}`
      : null;

  if (!src) {
    return (
      <span className="analytics-product-thumb analytics-product-thumb--empty" aria-hidden="true">
        <MdImageNotSupported />
      </span>
    );
  }

  return (
    <span className="analytics-product-thumb">
      <Image
        src={src}
        alt={name || ""}
        width={48}
        height={48}
        sizes="48px"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export default function TopProductsCard({
  products = [],
  t,
  locale,
  formatNumber,
}) {
  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            {t("analytics_top_products")}
            <InfoTip text={t("analytics_top_products_desc")} />
          </h2>
          <p className="admin-card-description">
            {t("analytics_top_products_desc")}
          </p>
        </div>
      </div>
      <div className="admin-card-body">
        {products.length === 0 ? (
          <SectionEmpty title={t("analytics_empty_products")} />
        ) : (
          <ol className="flex flex-col gap-1">
            {products.map((product, index) => {
              const name =
                locale === "ar"
                  ? product.nameAr || product.nameEn
                  : product.nameEn || product.nameAr;
              const content = (
                <>
                  <span className="analytics-product-rank" aria-hidden="true">
                    {formatNumber(index + 1)}
                  </span>
                  <ProductThumb imageUrl={product.imageUrl} name={name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--admin-ink)]">
                      {name}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      {formatNumber(product.views)} {t("analytics_views")}
                      {" · "}
                      {formatNumber(product.uniqueVisitors)}{" "}
                      {t("analytics_unique_viewers")}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="block text-base font-bold text-[var(--admin-ink)]">
                      {formatNumber(product.views)}
                    </span>
                    <span className="block text-[11px] font-medium text-[var(--admin-muted)]">
                      {t("analytics_views")}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={product.itemId}>
                  <Link
                    href={productPath(product)}
                    className="analytics-product-row"
                  >
                    {content}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
