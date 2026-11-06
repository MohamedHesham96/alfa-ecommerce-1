import Image from "next/image";
import Link from "next/link";

import { productPath } from "../../../../lib/seo";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL;

// The three homepage promo banners are full artwork (1122x898). Keep that ratio
// so the poster is never cropped, and only render the extra product details
// when the ad actually has a title/brand or a linked product.
export default function PromoAdCard({ ad, product, t, locale }) {
  const title = locale === "ar" ? ad?.titleAr : ad?.title;
  const brand = product?.brand || "";
  const hasDetails = Boolean(brand || title);
  const href = ad?.itemId
    ? productPath({
        ...product,
        itemId: ad.itemId,
        nameEn: product?.nameEn || ad?.title,
        nameAr: product?.nameAr || ad?.titleAr,
      })
    : null;
  const alt =
    [brand, title].filter(Boolean).join(" - ") || t("Special_Offer");

  const card = (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] transition-shadow duration-300 hover:shadow-[0_24px_55px_-30px_rgba(15,23,42,0.5)]">
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#f6f5f8]">
        {ad?.imageUrl ? (
          <Image
            src={IMAGE_BASE_URL + ad.imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 767px) 100vw, 33vw"
            quality={75}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-gray-400">
            {t("product_ads")}
          </div>
        )}
      </div>

      {hasDetails ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-4 text-center">
          {brand ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#CD4354]">
              {brand}
            </span>
          ) : null}
          {title ? (
            <p className="line-clamp-2 text-sm font-medium leading-6 text-gray-700">
              {title}
            </p>
          ) : null}
          {href ? (
            <span className="mt-1 text-xs font-semibold text-[#CD4354]">
              {t("shopNow")}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={alt}
      className="block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#CD4354] focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
