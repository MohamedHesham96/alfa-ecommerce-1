"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useFeature } from "../../../context/AppConfigContext";
import { useRefresh } from "../../../context/refreshContext";
import { useMenuOpen } from "../../../context/MenuOpenContext";
import { getRequest } from "../../../utils/requestsUtils";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FiHeart } from "react-icons/fi";
import { PiHouse, PiListBold, PiUser } from "react-icons/pi";

export default function BottomNav() {
  const { t } = useLanguage();
  const navigate = useRouter();
  const { refreshKey } = useRefresh();
  const { toggleMenu } = useMenuOpen();
  const wishlistEnabled = useFeature("features.wishlist.enabled");
  const [itemNum, setItemNum] = useState(0);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : "";

  const getProductInCart = useCallback(async () => {
    try {
      if (userId) {
        const res = await getRequest(`/api/shopCarts`);
        const rseData = res.data;
        setItemNum(rseData.itemLines.length);
      } else {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setItemNum(cart.length);
      }
    } catch (err) {
      console.error("Failed to get product in cart", err);
    }
  }, [userId]);

  useEffect(() => {
    getProductInCart();
  }, [getProductInCart, refreshKey]);

  const goToAccount = () => {
    if (userId) {
      navigate.push("/user/profile");
    } else {
      navigate.push("/signin");
    }
  };

  return (
    <nav
      className={`xs:flex lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]`}
    >
      <div className="flex w-full h-16 max-w-lg mx-auto">
        <button
          type="button"
          onClick={toggleMenu}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-gray-700"
        >
          <span className="text-[22px] leading-none">
            <PiListBold />
          </span>
          <span className="text-[11px] font-medium">{t("menu")}</span>
        </button>

        {wishlistEnabled ? (
          <Link prefetch={false}
            href="/user/wishlist"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-gray-700"
          >
            <span className="text-[22px] leading-none">
              <FiHeart />
            </span>
            <span className="text-[11px] font-medium">{t("wishlist")}</span>
          </Link>
        ) : null}

        <Link
          prefetch={false}
          href="/"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-gray-700"
        >
          <span className="text-[22px] leading-none">
            <PiHouse />
          </span>
          <span className="text-[11px] font-medium">{t("home")}</span>
        </Link>

        <Link prefetch={false}
          href="/user/cart"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-gray-700 relative"
        >
          <span className="relative text-[22px] leading-none">
            <MdOutlineShoppingCart />
            {itemNum > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                {itemNum > 99 ? "99+" : itemNum}
              </span>
            )}
          </span>
          <span className="text-[11px] font-medium">{t("cart")}</span>
        </Link>

        <button
          type="button"
          onClick={goToAccount}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-gray-700"
        >
          <span className="text-[22px] leading-none">
            <PiUser />
          </span>
          <span className="text-[11px] font-medium">{t("my_account")}</span>
        </button>
      </div>
    </nav>
  );
}