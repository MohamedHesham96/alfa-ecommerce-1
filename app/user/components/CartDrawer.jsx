"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { getThumbnailUrl } from "../../../utils/functions";
import { MdClose } from "react-icons/md";
import { useState } from "react";
import { usePwa } from "../../components/pwa/PwaProvider";

export default function CartDrawer({
  isOpen = false,
  onClose,
  items = [],
  netTotal = 0,
  itemNum = 0,
  shippingCost = 0,
  onRemove,
  onQuantityChange,
  freeShippingThreshold = null,
  viewCartHref = "/user/cart",
  checkoutHref = "/user/cart",
}) {
  const { t, locale } = useLanguage();
  const { isOnline } = usePwa();
  const navigate = useRouter();
  const [pendingLineId, setPendingLineId] = useState(null);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  const getProduct = (item) => (userId ? item.item : item);

  const getName = (product) =>
    locale === "ar" ? product.nameAr : product.nameEn;

  const formatPrice = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    return num.toLocaleString("en-US");
  };

  const getThumb = (product) =>
    product?.images
      ? `${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
        product.images[0]?.imageUrl,
      )}`
      : null;

  const freeShippingThresholdNum = Number(freeShippingThreshold);
  const hasShippingTarget =
    !Number.isNaN(freeShippingThresholdNum) && freeShippingThresholdNum > 0;
  const remaining =
    hasShippingTarget && netTotal < freeShippingThresholdNum
      ? freeShippingThresholdNum - netTotal
      : 0;
  const progress = hasShippingTarget
    ? Math.min(
      100,
      Math.round((netTotal / freeShippingThresholdNum) * 100),
    )
    : 0;

  const handleQuantityChange = async (item, product, newQuantity) => {
    if (!onQuantityChange) return;
    if (newQuantity < 1 || newQuantity === item.quantity) return;
    const lineId = item.itemLineId ?? null;
    setPendingLineId(lineId);
    try {
      await onQuantityChange(item.itemLineId, product?.itemId, newQuantity);
    } finally {
      setPendingLineId(null);
    }
  };

  return (
    <div className={` ${isOpen ? "fixed inset-0 z-[70]" : "hidden pointer-events-none"
      }`} aria-hidden={!isOpen}

    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      ></div>

      {/* Drawer */}
      <aside
        className={`absolute top-0 bottom-0 ${locale === "ar" ? "left-0" : "right-0"}  flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("shoppingCart")}{" "}
            {itemNum > 0 && (
              <span className="text-sm font-normal text-gray-400">
                ({itemNum})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
          >
            <MdClose className="h-5 w-5" />
            {t("close")}
          </button>
        </header>

        {/* Products (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <MdClose className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">{t("noProductsInCart")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item, index) => {
                const product = getProduct(item);
                const price = product?.unitPrice
                  ? product.unitPrice
                  : product?.price;
                const thumb = getThumb(product);
                const lineId = item.itemLineId ?? null;
                const isPending = pendingLineId !== null && pendingLineId === lineId;
                const canDecrease = Number(item.quantity) > 1;

                return (
                  <li key={index} className="flex gap-3 p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                      {thumb ? (
                        <Image
                          alt=""
                          src={thumb}
                          width={70}
                          height={70}
                          className="h-full w-full object-fill"
                        />
                      ) : (
                        <span className="text-3xl text-gray-300">
                          <MdClose />
                        </span>
                      )}
                    </div>
                    <div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 leading-snug break-words">
                          {getName(product)}
                        </h3>
                        <button
                          onClick={() =>
                            onRemove && onRemove(item.itemLineId, product?.itemId)
                          }
                          aria-label={t("remove") || "Remove"}
                          className="shrink-0 -mt-1 text-xl leading-none text-gray-400 transition-colors hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-1 text-gray-700">
                          <button
                            type="button"
                            disabled={!canDecrease || isPending}
                            aria-label={`${t("quantity")} −`}
                            onClick={() =>
                              handleQuantityChange(item, product, Number(item.quantity) - 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-base leading-none font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                          >
                            −
                          </button>

                          <span
                            className={`min-w-6 text-center text-sm font-medium ${isPending ? "text-gray-400" : "text-gray-900"
                              }`}
                          >
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={isPending}
                            aria-label={`${t("quantity")} +`}
                            onClick={() =>
                              handleQuantityChange(item, product, Number(item.quantity) + 1)
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full text-base leading-none font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-[#CD4354]">
                          {formatPrice(price)} {t("currency")}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Fixed bottom summary */}
        <footer className="border-t border-gray-200 bg-white px-5 py-4">
          {!isOnline ? (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              {userId ? t("pwa_cart_offline_error") : t("pwa_cart_local_note")}
            </p>
          ) : null}
 <div className="mb-4 flex items-center justify-between">
            <span className=" font-semibold">{t("shippingCost")}</span>
             <span className=" font-bold ">
              {items.length === 0 ? 0: formatPrice(shippingCost)} {t("currency")}
            </span>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xl font-semibold">{t("subtotal")}</span>
             <span className="text-xl font-bold text-[#CD4354]">
              {items.length === 0 ? 0: formatPrice(netTotal)} {t("currency")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onClose && onClose();
                navigate.push(viewCartHref);
              }}
              className="flex w-full items-center justify-center rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("view_cart")}
            </button>
            <button
            onClick={onClose}
              className={`flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white transition-colors ${items.length === 0
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[#E76E7D] hover:bg-[#CD4354]"
                }`}
            >
              {t("continueShopping")}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
