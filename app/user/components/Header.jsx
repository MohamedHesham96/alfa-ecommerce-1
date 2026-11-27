"use client";
import { useLanguage } from "../../../context/LanguageContext";
import { useFeature } from "../../../context/AppConfigContext";
import { IoMdSearch } from "react-icons/io";
import { MdLanguage, MdOutlineShoppingCart } from "react-icons/md";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { getRequest, postRequest, deleteRequest } from "../../../utils/requestsUtils";
import { decodeSearchInput } from "../../../utils/functions";
import { isAdminSession, useAuthRole } from "../../../utils/authRole";
import { toast } from "react-toastify";
import { useRefresh } from "../../../context/refreshContext";
import { useMenuOpen } from "../../../context/MenuOpenContext";
import { FiHeart } from "react-icons/fi";
import { PiArrowUUpLeft, PiListBold, PiPackage, PiUser } from "react-icons/pi";
import CartDrawer from "./CartDrawer";
import HeaderAccountChip from "./HeaderAccountChip";
import AuthModal from "../../components/auth/AuthModal";
import { useCartDrawerOpen } from "../../../context/CartDrawerOpenContext";
// import { useCartDrawerOpen } from "../../../context/CartDrawerOpenContext";

// The auth forms (and their react-select dependency) are only needed after
// the user opens the modal. Loading them lazily keeps ~30 KB of unused
// JavaScript out of the initial homepage bundle.
const SignIn_Form = dynamic(() => import("../../components/SignIn_Form"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-sm text-gray-500">...</div>,
});

const SignUp_Form = dynamic(() => import("../../components/SignUp_Form"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-sm text-gray-500">...</div>,
});

function CustomerBarLink({ href, icon, label }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-[#a11f33] hover:shadow-lg hover:shadow-[#0d0625]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-200 group-hover:bg-[#d63b4d]">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function Header() {
  const { t } = useLanguage();
  const navigate = useRouter();
  const [netTotal, setNetTotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [searchInput, setSearchInput] = useState();
  const { locale, setLocale } = useLanguage();
  const [username, setUsername] = useState();
  const [itemNum, setItemNum] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const { isCartOpen, setIsCartOpen } = useCartDrawerOpen();
  const { toggleMenu } = useMenuOpen();
  const { refreshKey } = useRefresh();
  const wishlistEnabled = useFeature("features.wishlist.enabled");
  const multipleAddressesEnabled = useFeature("MULTIPLE_USER_ADDRESSES");
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignin, setShowSignIn] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const {
    isAdmin,
    ready: roleReady,
    hasSession,
  } = useAuthRole();

  const closeAuthModal = () => {
    setOpenForm(false);
    setShowSignIn(false);
    setShowSignUp(false);
  };

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : "";
  const changeLanguage = async (newLang) => {
    const validLangs = ["ar", "en"];

    if (!validLangs.includes(newLang)) return;
    setLocale(newLang);
    localStorage.setItem("lang", newLang);

    // Language is a local preference for guests; only persist it server-side
    // when there is an authenticated session.
    if (!localStorage.getItem("id")) return;

    try {
      await postRequest(`/api/users/language/${newLang}`, "", "");
    } catch (err) {
      console.error("Failed to update language", err);
    }
  };
  const getProductInCart = useCallback(async () => {
    try {
      if (!roleReady) return;
      // Read the role synchronously as well: the component may re-render with
      // the freshly stored admin id before useAuthRole's state catches up,
      // which used to fire customer-only cart requests right after login.
      if (isAdmin || isAdminSession()) {
        setNetTotal(0);
        setItemNum(0);
        setCartItems([]);
        setShippingCost(0);
        return;
      }
      if (userId) {
        const res = await getRequest(`/api/shopCarts`);
        const resData = res.data;
        setNetTotal(resData.netTotal);
        setItemNum(resData.itemLines.length);
        setCartItems(resData.itemLines);
        setShippingCost(resData.shippingCost)
      } else {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setItemNum(cart.length);
        if (cart.length) {
          const items = await Promise.all(
            cart.map(async (item) => {
              const res = await getRequest(`/api/public/items/${item.id}`);
              return {
                ...res.data,
                quantity: item.quantity,
              };
            }),
          );
          setCartItems(items);
          const total = items.reduce((acc, item) => {
            const price = Number(item.price) || 0;
            return acc + price * Number(item.quantity || 0);
          }, 0);
          setNetTotal(total);
        } else {
          setCartItems([]);
          setNetTotal(0);
        }
      }
    } catch (err) {
      console.error("Failed to get product in cart", err);
    }
  }, [userId, isAdmin, roleReady]);
  const deleteItemFormCart = async (itemLineId, productID) => {
    try {
      if (isAdmin || isAdminSession()) {
        toast.info(t("adminActionUnavailable"));
        return;
      }
      if (userId) {
        await deleteRequest(
          `/api/shopCarts/deleteLine/${itemLineId}`,
          t("message"),
        );
      } else {
        let cart = JSON.parse(localStorage.getItem("cart") || "[]");
        cart = cart.filter((item) => Number(item.id) !== Number(productID));
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    } catch {
      return;
    }
    getProductInCart();
  };
  const changeQuantity = async (itemLineId, itemId, newQuantity) => {
    try {
      if (isAdmin || isAdminSession()) {
        toast.info(t("adminActionUnavailable"));
        return;
      }
      if (userId) {
        await postRequest(
          `/api/shopCarts/changeQuantity`,
          {
            itemLineId: itemLineId,
            quantity: newQuantity,
          },
          "",
        );
      } else {
        let cart = JSON.parse(localStorage.getItem("cart") || "[]");
        cart = cart.map((item) =>
          Number(item.id) === Number(itemId)
            ? { ...item, quantity: newQuantity }
            : item,
        );
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    } catch {
      return;
    }
    getProductInCart();
  };
  useEffect(() => {
    getProductInCart();
  }, [getProductInCart, refreshKey]);
  useEffect(() => {
  
    const firstName =
       localStorage.getItem("firstName") 

    setUsername(firstName);
    if(window.location.pathname.includes("search")){
const lastPort = window.location.pathname.split("/").filter(Boolean).pop();
setSearchInput(decodeSearchInput(lastPort))
    }
    // const userInfo = async()=>{
    //  const res = await getUserInfo()
    //  console.lo(res)
    // } 
    // userInfo()
  }, [username]);

  useEffect(() => {
    let active = true;

    const loadDefaultAddress = async () => {
      if (!roleReady || !hasSession || isAdmin || !userId) {
        setDefaultAddress(null);
        return;
      }

      try {
        if (multipleAddressesEnabled) {
          const response = await getRequest("/api/users/addresses", {
            suppressErrorToast: true,
          });
          const addresses = Array.isArray(response?.data)
            ? response.data
            : [];
          const preferred =
            addresses.find((address) => address.defaultAddress) ||
            addresses[0] ||
            null;
          if (active) setDefaultAddress(preferred);
        } else {
          const response = await getRequest("/api/users", {
            suppressErrorToast: true,
          });
          const user = response?.data;
          if (active) {
            setDefaultAddress(
              user?.address
                ? {
                    address: user.address,
                    governorate: user.governorate,
                    area: user.area,
                  }
                : null,
            );
          }
        }
      } catch {
        if (active) setDefaultAddress(null);
      }
    };

    loadDefaultAddress();

    return () => {
      active = false;
    };
  }, [roleReady, hasSession, isAdmin, userId, multipleAddressesEnabled]);

  const formattedNetTotal = `${netTotal.toLocaleString("en-US")} ${t("currency")}`;
  const cartCountLabel = `${itemNum.toLocaleString("en-US")} ${
    itemNum === 1 ? t("cart_item_singular") : t("cart_item_plural")
  }`;
  const defaultAddressLabel =
    defaultAddress?.label || defaultAddress?.address || "";
  const defaultAddressGovernorate = defaultAddress
    ? locale === "ar"
      ? defaultAddress.governorate?.nameAr
      : defaultAddress.governorate?.nameEn ||
        defaultAddress.governorate?.nameAr
    : "";
  const defaultAddressArea = defaultAddress
    ? locale === "ar"
      ? defaultAddress.area?.nameAr
      : defaultAddress.area?.nameEn || defaultAddress.area?.nameAr
    : "";
  const defaultAddressTitle = [
    defaultAddress?.label,
    defaultAddress?.address,
    defaultAddressArea,
    defaultAddressGovernorate,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <header className="bg-[#0d0625] pt-[env(safe-area-inset-top)]">
      <div className="md:flex xs:hidden gap-2 flex-wrap gap-y-1 items-center text-white p-2 text-xs w-full justify-between">
        <div className="flex flex-wrap justify-start items-center gap-2">
          <Link
            href={"/user/about"}
            prefetch={false}
            className="hover:text-gray-100"
          >
            {t("about_us")}
          </Link>
          <hr
            className="w-[1px] h-4 border-0  bg-gray-300"
          />
          <Link prefetch={false}
            href={"/#footer"}
            className="hover:text-gray-100"
          >
            {t("contact_us")}
          </Link>
          <hr
            className="w-[1px] h-4 border-0  bg-gray-300"
          />
          {isAdmin ? (
            <Link
              href={"/admin/Dashboard"}
              prefetch={false}
              className="font-semibold text-red-300 hover:text-white"
            >
              {t("dashboard")}{" "}
            </Link>
          ) : (
            <Link
              href={"/user/ordershistory"}
              prefetch={false}
              className="hover:text-gray-100"
            >
              {t("orders")}{" "}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap justify-start items-center gap-2">
          {isAdmin ? null : (
            <>
              <Link
                href={"/user/returnorders"}
                prefetch={false}
                className="hover:text-gray-1000"
              >
                {t("returns")}{" "}
              </Link><hr
                className="w-[1px] h-4 border-0  bg-gray-300"
              />
            </>
          )}
          <Link
            href={"/user/about#Guarantee_Policy"}
            prefetch={false}
            className="hover:text-gray-100"
          >
            {t("Guarantee_Policy")}
          </Link><hr
            className="w-[1px] h-4 border-0  bg-gray-300"
          />
          <Link
            href={"/user/about#Return_Policy"}
            prefetch={false}
            className="hover:text-gray-100"
          >
            {t("Return_Policy")}
          </Link>
        </div>

      </div>
      <hr
        className="h-px border-0 bg-gray-600"
      />
      <div className="w-full  flex items-center  p-5  justify-between flex-wrap gap-y-3 min-w-0 ">
        <button onClick={toggleMenu} aria-label={t("open_menu")} className="text-white text-3xl xs:block lg:hidden">
          <PiListBold />
        </button>
        <div className="flex justify-center items-center min-w-0">
          <Link prefetch={false} href="/" className="flex justify-center items-center ">

            <span className="relative w-12 h-12 ">
              <Image
                src="/Images/logo.png"
                alt={t("logo_alt")}
                fill
                sizes="48px"
                quality={75}
                className="object-contain"
              />
            </span>
            <div className="cursor-pointer min-w-0">
              <span className="text-3xl  text-white font-bold ">
                {t("alfa_group")}
              </span>
            </div>

          </Link>
        </div>

        <div
          className="lg:flex xs:hidden items-center bg-white justify-start border-2 w-[50%] max-w-[560px] min-w-0 bg-none h-10  rounded-full"

        >
          <button
            className="text-white h-full border-2 rounded-full text-2xl bg-[#e14a5c] p-1 "
            aria-label={t("search")}
            onClick={() => {
              searchInput
                ? navigate.push("/user/search/" + encodeURIComponent(searchInput))
                : navigate.push("/");
            }}
          >
            <IoMdSearch />
          </button>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchInput
                  ? navigate.push("/user/search/" + encodeURIComponent(searchInput))
                  : navigate.push("/");
              }
            }}
            placeholder={t("search") + "..."}
            type="search"
            enterKeyHint="search"
            className="w-full h-full text-base bg-none font-semibold outline-none rounded-e-full placeholder:text-sm  flex items-center p-1 "
          />
        </div>

        <div className="flex items-center lg:gap-5 xs:gap-1 ">
          <div className="flex items-center   cursor-pointer ">

          </div>

          <div className="flex items-center gap-1 text-white lg:gap-3">
            <button
              type="button"
              aria-label={t("change_language")}
              title={t("change_language")}
              onClick={() => {
                const newLocale = locale === "ar" ? "en" : "ar";
                setLocale(newLocale);
                changeLanguage(newLocale);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <MdLanguage className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (isAdmin || isAdminSession()) {
                  toast.info(t("adminActionUnavailable"));
                  return;
                }
                setIsCartOpen(true);
              }}
              aria-disabled={isAdmin}
              aria-label={
                isAdmin
                  ? t("adminActionUnavailable")
                  : `${t("cart")}: ${cartCountLabel} - ${formattedNetTotal}`
              }
              title={isAdmin ? t("adminActionUnavailable") : undefined}
              className={`group hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 text-start transition duration-200 lg:flex ${
                isAdmin
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              }`}
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors duration-200 group-hover:bg-white/15">
                <MdOutlineShoppingCart className="h-6 w-6" aria-hidden="true" />
                {!isAdmin && itemNum > 0 ? (
                  <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e14a5c] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-[#0d0625]">
                    {itemNum > 99 ? "99+" : itemNum}
                  </span>
                ) : null}
              </span>

              <span aria-hidden="true" className="h-8 w-px shrink-0 bg-white/15" />

              <span className="flex min-w-[5rem] flex-col items-start gap-0.5 whitespace-nowrap pe-1 leading-tight">
                <span className="text-[15px] font-bold tabular-nums text-[#E76E7D]">
                  {isAdmin ? t("admin") : formattedNetTotal}
                </span>
                <span className="text-xs font-medium tabular-nums text-white/65">
                  {isAdmin ? t("dashboard") : cartCountLabel}
                </span>
              </span>
            </button>
           

            <button
              type="button"
              aria-label={
                isAdmin
                  ? t("dashboard")
                  : hasSession
                    ? t("personalAccount")
                    : t("login") + " / " + t("register")
              }
              className="xs:flex lg:hidden items-center gap-1 rounded p-1 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              onClick={() => {
                if (isAdmin) {
                  navigate.push("/admin/Dashboard");
                } else if (userId) {
                  navigate.push("/user/profile");
                } else {
                  setShowSignUp(false);
                  setShowSignIn(true);
                  setOpenForm(true);
                }
              }}
            >
              <span className="w-8 h-8">
                <PiUser className="w-full h-full" aria-hidden="true" />
              </span>
            </button>

          </div>
        </div>
      </div>
      <div className="relative w-full overflow-hidden bg-gradient-to-l from-[#b8243b] via-[#d63b4d] to-[#e14a5c] shadow-[0_12px_30px_-18px_rgba(13,6,37,0.85)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_180%_at_50%_-45%,rgba(255,255,255,0.42),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#0d0625]/15" />

        <div className="relative mx-auto hidden w-full items-center justify-between gap-4 px-6 py-2.5 lg:flex">
          <nav className="flex items-center gap-1.5">
            {wishlistEnabled && !isAdmin ? (
              <CustomerBarLink
                href="/user/wishlist"
                icon={<FiHeart className="h-4 w-4" />}
                label={t("wishlist")}
              />
            ) : null}
            {!isAdmin && userId ? (
              <>
                <CustomerBarLink
                  href="/user/ordershistory"
                  icon={<PiPackage className="h-4 w-4" />}
                  label={t("orders")}
                />
                <CustomerBarLink
                  href="/user/returnorders"
                  icon={<PiArrowUUpLeft className="h-4 w-4" />}
                  label={t("returns")}
                />
              </>
            ) : null}
          </nav>

          <HeaderAccountChip
            isAdmin={isAdmin}
            hasSession={hasSession}
            username={username}
            addressLabel={defaultAddressLabel}
            addressMeta={defaultAddressGovernorate}
            addressTitle={defaultAddressTitle}
            onClick={() => {
              if (isAdmin) {
                navigate.push("/admin/Dashboard");
              } else if (userId) {
                navigate.push("/user/profile");
              } else {
                setShowSignUp(false);
                setShowSignIn(true);
                setOpenForm(true);
              }
            }}
          />
        </div>

        <div className="relative mx-6 my-3 flex h-10 items-center justify-start rounded-full border-2 border-white bg-white lg:hidden">
          <button
            className="text-white h-full border-2 rounded-full text-2xl bg-[#e14a5c] p-1 "
            aria-label={t("search")}
            onClick={() => {
              searchInput
                ? navigate.push("/user/search/" + encodeURIComponent(searchInput))
                : navigate.push("/");
            }}
          >
            <IoMdSearch />
          </button>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                searchInput
                  ? navigate.push("/user/search/" + encodeURIComponent(searchInput))
                  : navigate.push("/");
              }
            }}
            placeholder={t("search") + "..."}
            type="search"
            enterKeyHint="search"
            className="w-full h-full text-base bg-none font-semibold outline-none rounded-e-full placeholder:text-sm  flex items-center p-1 "
          />
        </div>
      </div>

      <AuthModal
        key={showSignUp ? "signup" : "signin"}
        open={openForm}
        onClose={closeAuthModal}
        labelledBy={showSignUp ? "auth-signup-title" : "auth-signin-title"}
      >
        {showSignin ? (
          <SignIn_Form
            popUp={true}
            setShowSignUp={setShowSignUp}
            setShowSignIn={setShowSignIn}
            setOpenForm={setOpenForm}
          />
        ) : showSignUp ? (
          <SignUp_Form
            popUp={true}
            setShowSignIn={setShowSignIn}
            setShowSignUp={setShowSignUp}
            setOpenForm={setOpenForm}
          />
        ) : null}
      </AuthModal>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        netTotal={netTotal}
        itemNum={itemNum}
        onRemove={deleteItemFormCart}
        onQuantityChange={changeQuantity}
        freeShippingThreshold={null}
        shippingCost={shippingCost}
      />
    </header>
  );
}
