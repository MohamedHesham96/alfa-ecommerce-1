"use client";
import { IoShareSocial } from "react-icons/io5";
import { FaChevronDown, FaRegHeart } from "react-icons/fa6";
import { FaShippingFast } from "react-icons/fa";
import { postRequest } from "../../../../utils/requestsUtils";
import { useRouter } from "next/navigation";
import { useRefresh } from "../../../../context/refreshContext";
import { useCartDrawerOpen } from "../../../../context/CartDrawerOpenContext";
import { useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { useFeature } from "../../../../context/AppConfigContext";
import { toast } from "react-toastify";
import Link from "next/link";
import StarRating from "../../components/StarRating";
import { categoryPath } from "../../../../lib/seo";
import { isAdminSession, useAuthRole } from "../../../../utils/authRole";
import { trackCartAdd, trackWishlistAdd } from "../../../../lib/analytics/client";

export default function ProductInfo({
    product,
    itemId,
    showSku = true,
    showStockStatus = true,
}) {
    const navigate = useRouter();
    const { triggerRefresh } = useRefresh();
    const { setIsCartOpen } = useCartDrawerOpen();
    const [count, setCount] = useState(1);
    const { locale, t } = useLanguage();
    const wishlistEnabled = useFeature("features.wishlist.enabled");
    const { isAdmin } = useAuthRole();

    const userId = typeof window !== "undefined" ? localStorage.id : "";

    const discount =
        product.oldPrice && product.price && product.oldPrice > product.price
            ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
            : 0;

    const description =
        locale === "ar" ? product.descriptionAr : product.descriptionEn;
    const productName =
        locale === "ar"
            ? product.nameAr || product.nameEn
            : product.nameEn || product.nameAr;

    const [descriptionExpanded, setDescriptionExpanded] = useState(false);

    const descriptionLineCount = description
        ? description.split(/\r?\n/).length
        : 0;
    const canExpandDescription =
        description && (description.length > 220 || descriptionLineCount > 6);

    const addFavoriteItems = async () => {
        if (isAdmin || isAdminSession()) {
            toast.info(t("adminActionUnavailable"));
            return;
        }
        if (userId) {
            const response = await postRequest(
                `/api/users/favoriteItems/${itemId}`,
                "",
                "",
            );
            // The backend reports whether a row was actually inserted, so a
            // repeated click on an existing favorite is not counted again.
            if (response?.data?.added === true) {
                trackWishlistAdd(itemId);
            }
        } else {
            const productItem = {
                id: itemId,
            };

            let favoriteItems = JSON.parse(
                localStorage.getItem("favoriteItems") || "[]",
            );

            const existingItem = favoriteItems.find((item) => item.id === itemId);

            if (!existingItem) {
                favoriteItems.push(productItem);
                localStorage.setItem("favoriteItems", JSON.stringify(favoriteItems));
                trackWishlistAdd(itemId);
                toast.success(t("product_added_to_wishlist"));
            }
        }
    };

    const handleShare = async () => {
        const productUrl = window.location.href;

        if (navigator.share) {
            await navigator.share({
                title: productName,
                url: productUrl,
            });
        } else {
            await navigator.clipboard.writeText(productUrl);
            toast.success(t("link_copied"));
        }
    };

    const addToCart = async (buyNow) => {
        try {
            if (isAdmin || isAdminSession()) {
                toast.info(t("adminActionUnavailable"));
                return;
            }
            if (!product.available) return;

            if (userId) {
                await postRequest(
                    `/api/shopCarts/addLine`,
                    {
                        itemId: itemId,
                        quantity: count,
                    },
                    "",
                );
                triggerRefresh();
                trackCartAdd(itemId);

                if (buyNow) {
                    navigate.push("/user/cart");
                } else {
                    setIsCartOpen(true);
                }
            } else {
                const productItem = {
                    id: itemId,
                    quantity: count,
                };

                let cart = JSON.parse(localStorage.getItem("cart") || "[]");

                const existingItem = cart.find((item) => item.id === itemId);

                if (existingItem) {
                    existingItem.quantity += count;
                } else {
                    cart.push(productItem);
                }
                triggerRefresh();
                localStorage.setItem("cart", JSON.stringify(cart));
                trackCartAdd(itemId);
                if (buyNow) {
                    navigate.push("/user/cart");
                } else {
                    setIsCartOpen(true);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const quantityButtonClass =
        "flex h-full w-10 items-center justify-center text-lg font-bold text-gray-600 transition-colors hover:text-[#E14A5C] disabled:cursor-not-allowed disabled:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C]";

    return (
        <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
            <div className={`flex items-center justify-between gap-3 rounded-full px-4 py-2 text-sm text-white sm:px-5 sm:py-2.5 sm:text-base ${locale === "ar" ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-[#da643b] via-orange-400 to-[#f6b30f]`}>
                <span className="min-w-0 font-medium">{t("Fast_delivery")}</span>
                <FaShippingFast className="h-6 w-6 shrink-0 text-[#d91c10]" aria-hidden />
            </div>

            <div className="min-w-0">
                <h1 className="break-words text-xl font-bold leading-snug text-gray-900 sm:text-2xl lg:text-3xl">
                    {locale === "ar" ? product.nameAr : product.nameEn}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:text-sm">
                    {showSku ? (
                        <span>
                            {t("code")}:{" "}
                            <span className="font-medium text-gray-700">{product.code}</span>
                        </span>
                    ) : null}
                    {product.category.id ? (
                        <span className="inline-flex min-w-0 items-center gap-1">
                            <span>{t("product_category")}:</span>
                            <Link
                                href={categoryPath(product.category)}
                                className="max-w-[180px] truncate font-medium text-gray-700 transition-colors hover:text-[#E14A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C]"
                            >
                                {locale === "ar" ? product.category.nameAr : product.category.nameEn}
                            </Link>
                        </span>
                    ) : null}
                </div>
            </div>

            {product.averageRating === 0 ? null : (
                <div className="flex items-center gap-2">
                    <StarRating rating={product.averageRating} />
                    <span className="text-sm text-gray-500">
                        ({product.ratingCount} {t("reviews")})
                    </span>
                </div>
            )}

            {product.available ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl font-bold text-[#E14A5C] sm:text-3xl">
                        {product.price
                            ? product.price.toLocaleString("en-US") + " " + t("currency")
                            : ""}
                    </span>
                    {product.oldPrice ? (
                        <span className="text-base text-gray-500 line-through sm:text-lg">
                            {product.oldPrice.toLocaleString("en-US") + " " + t("currency")}
                        </span>
                    ) : null}
                    {discount > 0 ? (
                        <span
                            dir="ltr"
                            className="rounded-full bg-[#557A3A] px-2.5 py-1 text-xs font-semibold text-white"
                        >
                            -{discount}%
                        </span>
                    ) : null}
                </div>
            ) : null}

            {showStockStatus ? (
                <div className="flex items-center text-xs font-medium sm:text-sm">
                    <span
                        className={`inline-flex items-center gap-2 ${product.available ? "text-green-600" : "text-red-600"}`}
                    >
                        <span
                            aria-hidden
                            className={`h-2 w-2 rounded-full ${product.available ? "bg-green-500" : "bg-red-500"}`}
                        />
                        {product.available ? t("available_in_store") : t("Currently_unavailable")}
                    </span>
                </div>
            ) : null}

            {description ? (
                <div className="min-w-0">
                    <p
                        className={`whitespace-pre-line break-words text-xs leading-relaxed text-gray-500 sm:text-sm ${
                            descriptionExpanded ? "" : "line-clamp-6"
                        }`}
                    >
                        {description}
                    </p>

                    {canExpandDescription ? (
                        <button
                            type="button"
                            onClick={() => setDescriptionExpanded((value) => !value)}
                            aria-expanded={descriptionExpanded}
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#E14A5C] transition-colors hover:text-[#CD4354] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C] sm:text-sm"
                        >
                            {descriptionExpanded
                                ? t("show_less")
                                : t("show_more")}
                            <FaChevronDown
                                aria-hidden
                                className={`h-3 w-3 transition-transform duration-300 ${
                                    descriptionExpanded ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                    ) : null}
                </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
                <div
                    className="flex h-12 shrink-0 items-center rounded-full border border-gray-200 bg-white"
                    role="group"
                    aria-label={t("quantity")}
                >
                    <button
                        type="button"
                        aria-label={`${t("quantity")} -`}
                        disabled={isAdmin || !product.available || count <= 1}
                        onClick={() => setCount((value) => Math.max(1, value - 1))}
                        className={`${quantityButtonClass} rounded-s-full`}
                    >
                        −
                    </button>
                    <span
                        aria-live="polite"
                        className="w-8 text-center text-sm font-semibold text-gray-800"
                    >
                        {count}
                    </span>
                    <button
                        type="button"
                        aria-label={`${t("quantity")} +`}
                        disabled={isAdmin || !product.available}
                        onClick={() => setCount((value) => value + 1)}
                        className={`${quantityButtonClass} rounded-e-full`}
                    >
                        +
                    </button>
                </div>

                <button
                    type="button"
                    disabled={isAdmin || !product.available}
                    onClick={() => addToCart(false)}
                    title={isAdmin ? t("adminActionUnavailable") : undefined}
                    className={`flex h-12 flex-auto items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C] focus-visible:ring-offset-2 ${
                        !isAdmin && product.available
                            ? "bg-[#E14A5C] text-white hover:bg-[#CD4354]"
                            : "cursor-not-allowed bg-gray-300 text-white"
                    }`}
                >
                    {t("addToCart")}
                </button>

                <button
                    type="button"
                    disabled={isAdmin || !product.available}
                    onClick={() => addToCart(true)}
                    title={isAdmin ? t("adminActionUnavailable") : undefined}
                    className={`flex h-12 w-full items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C] focus-visible:ring-offset-2 sm:w-auto sm:flex-auto ${
                        !isAdmin && product.available
                            ? "bg-[#F9DBDF] text-[#E14A5C] hover:bg-[#EDD0D3]"
                            : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                >
                    {t("buyNow")}
                </button>
            </div>

            {isAdmin ? (
                <p
                    role="status"
                    data-testid="admin-purchase-notice"
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
                >
                    {t("adminActionUnavailable")}
                </p>
            ) : null}

            <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 text-sm">
                {wishlistEnabled && !isAdmin ? (
                    <button
                        type="button"
                        onClick={addFavoriteItems}
                        className="inline-flex min-w-0 items-center gap-2 text-gray-600 transition-colors hover:text-[#E14A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C]"
                    >
                        <FaRegHeart className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="truncate">{t("addToWishList")}</span>
                    </button>
                ) : (
                    <span />
                )}
                <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex shrink-0 items-center gap-2 text-gray-600 transition-colors hover:text-[#E14A5C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E14A5C]"
                >
                    <IoShareSocial className="h-5 w-5" aria-hidden />
                    {t("share")}
                </button>
            </div>
        </div>
    );
}
