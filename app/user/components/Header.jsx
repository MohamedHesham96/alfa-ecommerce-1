"use client";
import { useLanguage } from "../../../context/LanguageContext";
import { useFeature } from "../../../context/AppConfigContext";
import { IoMdSearch } from "react-icons/io";
import {
  MdCancel,
  MdLanguage,
  MdOutlineShoppingCart,
} from "react-icons/md";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { getRequest, postRequest, deleteRequest } from "../../../utils/requestsUtils";
import { decodeSearchInput } from "../../../utils/functions";
import { useRefresh } from "../../../context/refreshContext";
import { useMenuOpen } from "../../../context/MenuOpenContext";
import { FiHeart } from "react-icons/fi";
import { PiListBold, PiUser } from "react-icons/pi";
import CartDrawer from "./CartDrawer";
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
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignin, setShowSignIn] = useState(false);
  const [openForm, setOpenForm] = useState(false);

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
  }, [userId]);
  const deleteItemFormCart = async (itemLineId, productID) => {
    try {
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
          <Link
            href={"/user/ordershistory"}
            prefetch={false}
            className="hover:text-gray-100"
          >
            {t("orders")}{" "}
          </Link>
        </div>
        <div className="flex flex-wrap justify-start items-center gap-2">
          <Link
            href={"/user/returnorders"}
            prefetch={false}
            className="hover:text-gray-1000"
          >
            {t("returns")}{" "}
          </Link><hr
            className="w-[1px] h-4 border-0  bg-gray-300"
          />
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
        <button onClick={toggleMenu} aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"} className="text-white text-3xl xs:block lg:hidden">
          <PiListBold />
        </button>
        <div className="flex justify-center items-center min-w-0">
          <Link prefetch={false} href="/" className="flex justify-center items-center ">

            <span className="relative w-12 h-12 ">
              <Image
                src="/Images/logo.png"
                alt="شعار ألفا جروب تكنولوجي"
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
            aria-label={t("search") || "بحث"}
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

          <div className="flex items-center xs:gap-2 lg:gap-5 text-white">
            <button
              aria-label={locale === "ar" ? "تغيير اللغة" : "Change language"}
              onClick={() => {
                const newLocale = locale === "ar" ? "en" : "ar";
                setLocale(newLocale);
                changeLanguage(newLocale);
              }}
            >
              <MdLanguage className="w-7 h-7 text-white" />
            </button>
            <div
               onClick={() => setIsCartOpen(true)}
              className=" items-center justify-center gap-2 xs:hidden lg:flex cursor-pointer"
            >
               <span className="relative">
               <MdOutlineShoppingCart className="w-9 h-9"
                  />
               {/* {itemNum > 0 && (
                 <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                   {itemNum > 99 ? "99+" : itemNum}
                 </span>
               )} */}
             </span>
            <hr
              className="w-[1px] h-7 border-0  bg-gray-500"
            />
            <div className="flex flex-col text-sm justify-start items-start">
              <span className="text-[#E76E7D]">
                {itemNum === 0 ? 0 : netTotal.toLocaleString("en-US") + " " + t("currency")}
              </span>
               <span className=" text-xs">
                {itemNum }{" "}{t("Items")}
              </span>
            </div>
            </div>
           

            <div className="xs:flex lg:hidden items-center gap-1 cursor-pointer "
             onClick={() => {
                  if (userId) {
                    navigate.push("/user/profile");
                  } else {
                    setShowSignUp(false);
                    setShowSignIn(true);
                    setOpenForm(true);

                  }
                }}
            >
              <span className="w-8 h-8">
                <PiUser className="w-full h-full " />
              </span>
              {/* <span className=" font-semibold text-center xs:hidden lg:flex">
                login
              </span> */}
            </div>

          </div>
        </div>
      </div>
      <div className="w-full px-6 bg-[#d63b4d]  py-3">
        <div className="xs:hidden lg:flex text-white">
          <div className="w-full flex justify-between ">
            <div className="w-full flex"></div>
            <div className="w-full flex justify-end items-center gap-5">
              {wishlistEnabled ? (
                <div className="">
                  <Link href="/user/wishlist" prefetch={false} className="xs:hidden lg:flex items-center gap-1">
                    <FiHeart className="w-5 h-5 " />
                    <span className=" font-semibold ">{t("wishlist")} </span>
                  </Link>
                </div>
              ) : null}
              <hr className="w-px h-5 bg-gray-50 "></hr>
              <div className=" items-center gap-1 cursor-pointer flex  "
                onClick={() => {
                  if (userId) {
                    navigate.push("/user/profile");
                  } else {
                    setShowSignUp(false);
                    setShowSignIn(true);
                    setOpenForm(true);

                  }
                }}
              >
                <span className="w-6 h-6 font-bold xs:hidden lg:block">
                  <PiUser className="w-full h-full " />
                </span>
                <span className=" font-semibold  text-center ">
                  {username ? username : t("login") + " / " +t("register")}
                </span>
              </div>
            </div>
          </div>


        </div>

        <div
          className="xs:flex lg:hidden items-center bg-white justify-start border-2 w-full bg-none h-10   rounded-full"

        >
          <button
            className="text-white h-full border-2 rounded-full text-2xl bg-[#e14a5c] p-1 "
            aria-label={t("search") || "بحث"}
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

      <div
        className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto ${openForm ? "block" : "hidden"}`}
      >
        <div className=" bg-white rounded-md relative w-full max-w-[480px] my-auto max-h-[90vh] overflow-y-auto">
          <MdCancel
            className="w-6 h-6 cursor-pointer hover:text-red-600 absolute top-2 right-2 "
            onClick={() => {
              setOpenForm(false);
              setShowSignIn(false);
              setShowSignUp(false);
            }}
          />
          {showSignin ? (
            <SignIn_Form popUp={true} setShowSignUp={setShowSignUp} setShowSignIn={setShowSignIn} setOpenForm={setOpenForm} />
          ) : showSignUp ? (
            <SignUp_Form popUp={true} setShowSignIn={setShowSignIn} setShowSignUp={setShowSignUp} setOpenForm={setOpenForm} />
          ) : ""}
        </div>
      </div>

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
