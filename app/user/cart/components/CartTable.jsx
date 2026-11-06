import Image from "next/image";
import { useLanguage } from "../../../../context/LanguageContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import { MdCancel } from "react-icons/md";
import { useRouter } from "next/navigation";

export default function CartTable({
  items,
  loading,
  onRemove,
  onQuantityChange,
}) {
  const { t, locale } = useLanguage();
 const navigate = useRouter()
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return value.toLocaleString("en-US");
  };

  const getProduct = (item) => (userId ? item.item : item);

  const getName = (product) =>
    locale === "ar" ? product.nameAr : product.nameEn;

  return (
    <>
      {/* ── Mobile (XS) card layout ─────────────────────────────── */}
      <div className="xs:flex md:hidden flex-col gap-0 w-full rounded-3xl bg-white overflow-hidden">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div
              key={`mobile-skeleton-${index}`}
              className="flex gap-4 p-4 border-b border-gray-100"
            >
              <div className="h-24 w-24 shrink-0 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="flex-1 flex flex-col gap-3 py-1">
                <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-10 bg-gray-100 rounded-full animate-pulse w-32"></div>
              </div>
            </div>
          ))
        ) : items.length !== 0 ? (
          items.map((item, index) => {
            const product = getProduct(item);
            const price = product.unitPrice
              ? product.unitPrice
              : product.price;
            const subtotal = item.totalPrice
              ? item.totalPrice
              : price * item.quantity;

            return (
              <div
                key={index}
                className="flex p-4 border-b border-gray-100"
              >
                <div className="flex gap-4 w-full">
                  <div 
                     onClick={()=>{
                         navigate.push(`/user/productdetails/${product.nameEn}/${product.itemId}`);
                      }}
                  className="flex h-24 w-24 shrink-0 items-center justify-center cursor-pointer overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      alt=""
                      src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(product.images[0]?.imageUrl)}`}
                      width={96}
                      height={96}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h1 
                         onClick={()=>{
                         navigate.push(`/user/productdetails/${product.nameEn}/${product.itemId}`);
                      }}
                      className="font-semibold text-lg text-gray-900 leading-snug break-words">
                        {getName(product)}
                      </h1>
                      <button
                        onClick={() =>
                          onRemove(item.itemLineId, product.itemId)
                        }
                        aria-label={t("remove")}
                        className="shrink-0 -mt-1 text-2xl leading-none text-gray-400 transition-colors hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex flex-col divide-y divide-dotted divide-gray-200 mt-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("price")}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(price)} {t("currency")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("quantity")}
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-gray-700">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                onQuantityChange(
                                  item.itemLineId,
                                  product.itemId,
                                  item.quantity - 1,
                                );
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
                          >
                            −
                          </button>

                          <span className="min-w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => {
                              onQuantityChange(
                                item.itemLineId,
                                product.itemId,
                                item.quantity + 1,
                              );
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-500">
                          {t("subtotal")}
                        </span>
                        <span className="text-sm font-bold text-[#da643b]">
                          {formatPrice(subtotal)} {t("currency")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-gray-500">
            {t("noProductsInCart")}
          </div>
        )}
      </div>

      {/* ── Desktop / Tablet table layout ───────────────────────── */}
      <div className="xs:hidden md:flex w-full min-w-0 h-[400px]  rounded-3xl bg-white">
        <table className="w-full min-w-[640px] h-auto">
          <thead className="text-center uppercase tracking-wide">
            <tr className="h-20 border-b border-b-gray-200 border-gray-100">
              <th className="w-12"></th>
              <th className="px-5 text-start">{t("product")}</th>
              <th className="px-5 text-start">{t("price")}</th>
              <th className="px-5 text-start">{t("quantity")}</th>
              <th className="px-5 text-end">{t("subtotal")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-md ">
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="py-5 ps-5">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="py-5 px-5">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 shrink-0 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-32"></div>
                        <div className="h-2 bg-gray-200 rounded-md animate-pulse w-20"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-5">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  </td>
                  <td className="py-5 px-5">
                    <div className="h-9 w-28 bg-gray-100 rounded-full animate-pulse"></div>
                  </td>
                  <td className="py-5 px-5">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ms-auto"></div>
                  </td>
                </tr>
              ))
            ) : items.length != 0 ? (
              items.map((item, index) => {
                const product = userId ? item.item : item;
                return (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-gray-50/60 h-10 "
                  >
                    <td className="py-5 ps-5">
                      <button
                        onClick={() => {
                          onRemove(item.itemLineId, product.itemId);
                        }}
                        className="shrink-0 -mt-1 text-2xl leading-none text-gray-400 transition-colors hover:text-red-500"
                      >
                        ×
                      </button>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-4 cursor-pointer"
                      onClick={()=>{
                         navigate.push(`/user/productdetails/${product.nameEn}/${product.itemId}`);
                      }}
                      >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                          <Image
                            alt=""
                            src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(product.images[0]?.imageUrl)}`}
                            width={80}
                            height={80}
                            className="h-full w-full object-fill"
                          />
                        </div>

                        <div>
                          <h1 className="font-semibold text-sm text-gray-900">
                            {locale === "ar"
                              ? product.nameAr
                              : product.nameEn}
                          </h1>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-900">
                          {product.unitPrice
                            ? product.unitPrice.toLocaleString("en-US")
                            : product.price}{" "}
                          {t("currency")}{" "}
                        </span>

                        {product.oldUnitPrice ? (
                          <span className="text-xs text-gray-500 line-through">
                            {product.oldUnitPrice.toLocaleString("en-US")}{" "}
                            {t("currency")}
                          </span>
                        ) : product.oldPrice ? (
                          <span className="text-xs text-gray-500 line-through">
                            {product.oldPrice.toLocaleString("en-US")}{" "}
                            {t("currency")}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                    </td>
                    <td className="">
                      <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-2 text-gray-700">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              onQuantityChange(
                                item.itemLineId,
                                product.itemId,
                                item.quantity - 1,
                              );
                            }
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-lg leading-none font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => {
                            onQuantityChange(
                              item.itemLineId,
                              product.itemId,
                              item.quantity + 1,
                            );
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-lg leading-none font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-end">
                      <span className="font-semibold text-[#da643b]">
                        {item.totalPrice
                          ? item.totalPrice.toLocaleString("en-US")
                          : item.price
                            ? item.price * item.quantity
                            : ""}{" "}
                        {t("currency")}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-8 text-center text-gray-500"
                >
                  {t("noProductsInCart")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
