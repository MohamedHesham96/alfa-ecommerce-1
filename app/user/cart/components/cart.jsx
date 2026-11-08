"use client";
// import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAppConfig } from "../../../../context/AppConfigContext";
import { usePwa } from "../../../components/pwa/PwaProvider";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiFillSafetyCertificate } from "react-icons/ai";
import {
  getRequest,
  postRequest,
  deleteRequest,
} from "../../../../utils/requestsUtils";
import { LuLoader } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
// import Link from "next/link";
import CartTable from "./CartTable";
import Select from "react-select";
import FulfillmentOptions from "./FulfillmentOptions";
import {
  FULFILLMENT_TYPE,
  buildOrderPayload,
  calculateCheckoutTotals,
  isPickupSelectionMissing,
} from "./checkoutFulfillment";
import { beginCriticalOperation } from "../../../../lib/pwa/criticalOperation";
import { getCrossTabCoordinator } from "../../../../lib/pwa/crossTab";
export default function Cart({ setShowSignIn }) {
  const { t, locale } = useLanguage();
  const { isOnline } = usePwa();
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [Checkout, setCheckout] = useState(false);
  const [summery, setSummery] = useState({
    totalOrder: "",
    totalDiscount: "",
    shappingCost: "",
    netTotal: "",
    address: ""
  });

  const [itemNum, setItemNum] = useState(0);
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;
  // const { locale } = useLanguage();

  const [isFirstAction, setIsFirstAction] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useRouter();
  const [paymentMethod, setPaymentMethod] = useState();
  const instapayEnabled = useAppConfig("payments.instapay.enabled", true);
  const cashOnDeliveryEnabled = useAppConfig(
    "payments.cashOnDelivery.enabled",
    true,
  );
  const creditCardEnabled = useAppConfig("payments.creditCard.enabled", false);
  const pickupEnabled = useAppConfig("pickup.enabled", false);
  const [fulfillmentType, setFulfillmentType] = useState(
    FULFILLMENT_TYPE.DELIVERY,
  );
  const [pickupPlaceId, setPickupPlaceId] = useState(null);
  const [pickupPlaces, setPickupPlaces] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState(false);
  const paymentMethodOptions = [
    ...(instapayEnabled
      ? [{ value: "INSTAPAY", label: t("INSTAPAY") }]
      : []),
    ...(cashOnDeliveryEnabled
      ? [{ value: "CASH_ON_DELIVERY", label: t("CASH_ON_DELIVERY") }]
      : []),
    ...(creditCardEnabled
      ? [{ value: "CREDIT_CARD", label: t("CREDIT_CARD") }]
      : []),
  ];
  const synced = useRef(false);

  const translate = (key, fallbackAr, fallbackEn) => {
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return locale === "en" ? fallbackEn : fallbackAr;
  };

  const checkoutDisabled =
    !isOnline ||
    items.length === 0 ||
    paymentMethodOptions.length === 0 ||
    (Boolean(userId) &&
      pickupEnabled &&
      fulfillmentType === FULFILLMENT_TYPE.PICKUP &&
      (isPickupSelectionMissing({
        pickupEnabled,
        fulfillmentType,
        pickupPlaceId,
      }) ||
        pickupLoading ||
        pickupError ||
        pickupPlaces.length === 0));

  const selectedPickupPlace = pickupPlaces.find(
    (place) => String(place.pickupPlaceId) === String(pickupPlaceId),
  );
  const isPickupSelected =
    pickupEnabled && fulfillmentType === FULFILLMENT_TYPE.PICKUP;
  const checkoutTotals = calculateCheckoutTotals({
    total: summery.totalOrder,
    shippingCost: summery.shappingCost,
    netTotal: summery.netTotal,
    fulfillmentType: isPickupSelected
      ? FULFILLMENT_TYPE.PICKUP
      : FULFILLMENT_TYPE.DELIVERY,
  });

  const loadPickupPlaces = useCallback(async () => {
    setPickupLoading(true);
    setPickupError(false);
    try {
      const res = await getRequest("/api/pickup-places/active");
      setPickupPlaces(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPickupPlaces([]);
      setPickupError(true);
    } finally {
      setPickupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!pickupEnabled) {
      setFulfillmentType(FULFILLMENT_TYPE.DELIVERY);
      setPickupPlaceId(null);
      setPickupPlaces([]);
      setPickupError(false);
      return;
    }
    if (fulfillmentType === FULFILLMENT_TYPE.PICKUP) {
      if (userId) {
        loadPickupPlaces();
      } else {
        setPickupPlaces([]);
        setPickupError(false);
      }
    }
  }, [pickupEnabled, fulfillmentType, loadPickupPlaces, userId]);

  useEffect(() => {
    if (
      pickupPlaceId &&
      !pickupPlaces.some(
        (place) => String(place.pickupPlaceId) === String(pickupPlaceId),
      )
    ) {
      setPickupPlaceId(null);
    }
  }, [pickupPlaces, pickupPlaceId]);

  const getProductInCart = useCallback(async () => {
    try {
      setLoadError(false);
      if (userId) {
        setLoading(true);

        const res = await getRequest("/api/shopCarts");
        const rseData = res.data;
        setItems(rseData.itemLines);
        setItemNum(rseData.itemLines.length);
        setSummery((prev) => ({
          ...prev,
          totalOrder: rseData.total,
          totalDiscount: rseData.totalDiscount,
          shappingCost: rseData.shippingCost,
          netTotal: rseData.netTotal,
          address: rseData.user.governorate.nameAr + " " + rseData.user.address
        }));
      } else {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        const items = await Promise.all(
          cart.map(async (item) => {
            const res = await getRequest(`/api/public/items/${item.id}`);

            return {
              ...res.data, // 👈 مهم جدًا
              quantity: item.quantity,
            };
          }),
        );
        setItems(items); // 👈 مهم
        setItemNum(items.length);
        // `totalOrder` must be the sum of the actual selling price (after the
        // item discount), matching the backend's `total`. `totalDiscount` is
        // informational and must not be subtracted again.
        const subtotal = items.reduce((acc, item) => {
          const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
          return acc + unitPrice * Number(item.quantity ?? 0);
        }, 0);
        const totalDiscount = items.reduce((acc, item) => {
          const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
          const oldUnitPrice = Number(item.oldUnitPrice ?? item.oldPrice ?? 0);
          const discount = Math.max(oldUnitPrice - unitPrice, 0);
          return acc + discount * Number(item.quantity ?? 0);
        }, 0);
        setSummery((prev) => ({
          ...prev,
          totalOrder: subtotal,
          totalDiscount: totalDiscount,
          netTotal: subtotal,
        }));
      }
    } catch (error) {
      // Do not render an empty cart as if the server had confirmed it. This
      // is especially important while offline or during an API outage.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const syncCart = async () => {
      try {
        if (!userId) return;
        if (synced.current) return;

        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        if (!cart.length) return;

        await Promise.all(
          cart.map((item) =>
            postRequest(
              `/api/shopCarts/addLine`,
              {
                itemId: item.id,
                quantity: item.quantity,
              },
              "",
            ),
          ),
        );
        getProductInCart();
        localStorage.removeItem("cart");

        synced.current = true; // 👈 بعد النجاح
      } catch (error) {
      }
    };

    syncCart();
  }, [userId, getProductInCart]);

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
  const placeOrder = async () => {
    // A service-worker update may not reload the page while an order is in
    // flight: the request must be allowed to reach a definitive server result.
    const releaseCriticalOperation = beginCriticalOperation("checkout");
    const crossTab = getCrossTabCoordinator();
    let releaseCrossTabCheckout = null;
    try {
      if (userId) {
        if (items.length != 0) {
          if (!paymentMethod) {
            toast.error(t("selectPaymentMethod"));
            return;
          }
          if (isPickupSelected && !pickupPlaceId) {
            toast.error(t("select_pickup_place"));
            return;
          }
          setLoading(true);
          // Hold a cross-tab checkout lock. The update gate cannot be acquired
          // while this lock is held, even from another tab.
          if (crossTab) {
            releaseCrossTabCheckout = await crossTab.beginCheckout("order");
          }
          await postRequest(
            `/api/users/orders/place-order`,
            buildOrderPayload({
              paymentMethod,
              fulfillmentType: isPickupSelected
                ? FULFILLMENT_TYPE.PICKUP
                : FULFILLMENT_TYPE.DELIVERY,
              pickupPlaceId,
            }),
            "",
          );
          navigate.push("/user/ordershistory");
        } else {
          toast.error(t("noProductsInCart"));
        }
      } else {
        setShowSignIn(true);
      }
    } catch (error) {
    } finally {
      if (releaseCrossTabCheckout) releaseCrossTabCheckout();
      releaseCriticalOperation();
      setLoading(false);
    }
  };

  useEffect(() => {
    getProductInCart();
  }, [getProductInCart]);
  return (
    <div className="xl:p-10 xs:p-7  ">
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Image
            src="/Images/logo.png"
            alt=""
            className="w-[100px] h-[100px]  border-t-transparent rounded-full animate-pulse"
            width={100}
            height={100}
            priority
          />
        </div>
      )}

      {!isOnline || loadError ? (
        <div
          data-testid="cart-offline-notice"
          role="status"
          className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          {!isOnline
            ? userId
              ? translate(
                  "pwa_cart_offline_error",
                  "تعذر تحميل سلة الحساب دون اتصال. أعد الاتصال لعرض السلة وإتمام الطلب.",
                  "Your account cart could not be loaded offline. Reconnect to view it and complete checkout.",
                )
              : translate(
                  "pwa_cart_local_note",
                  "سلة الضيف محفوظة على هذا الجهاز. سجّل الدخول عند توفر الاتصال لمزامنتها.",
                  "Your guest cart is saved on this device. Sign in when you are online to sync it.",
                )
            : translate(
                "pwa_cart_load_error",
                "تعذر تحميل السلة. حاول مرة أخرى.",
                "The cart could not be loaded. Please try again.",
              )}
        </div>
      ) : null}
      {/* <div className="flex justify-between py-5">
        <div className="">
          <h1 className="text-4xl font-bold mb-2"> {t("shoppingCart")} </h1>
          <span className="text-sm text-gray-500 font-semibold">
            {t("inYourCart") + " " + itemNum + " " + t("products")}
          </span>
        </div>
        <Link
          href="/"
          className="md:text-sm xs:text-xs font-semibold text-red-600 flex items-center gap-2"
        >
          <h1>{t("continueShopping")} </h1>
          <span className="">
            {locale === "ar" ? <FaArrowLeft /> : <FaArrowRight />}
          </span>
        </Link>
      </div> */}
      <div className="flex lg:flex-row xs:flex-col gap-5 ">
        <CartTable items={items} loading={loading} onRemove={deleteItemFormCart} onQuantityChange={changeQuantity} />
        <div className="lg:w-[40%]  xs:w-full">
          {loading ? (
            // Skeleton rows
            <div className=" p-7  w-full bg-white rounded-3xl ">
              <h1 className="mb-10 text-2xl font-bold">{t("cartTotals")} </h1>
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-600"> {t("Subtotal")} </span>
                <span className="h-4 bg-gray-200 rounded animate-pulse w-20">
                  {" "}
                </span>
              </div>
              <hr className="my-5"></hr>
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-600">{t("ShippingTo")} </span>
                <span className="h-4 bg-gray-200 rounded animate-pulse w-20">
                  {" "}
                </span>
              </div>

              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-600">{t("shippingCost")} </span>
                <span className="h-4 bg-gray-200 rounded animate-pulse w-20">
                  {" "}
                </span>
              </div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-600">{t("payment_method")} </span>
                <span className="h-4 bg-gray-200 rounded animate-pulse w-20">
                  {" "}
                </span>
              </div>
              <hr className="my-6" />
              <div className="flex justify-between items-center text-2xl font-semibold">
                <span>{t("Total")} </span>
                <span className="h-4 bg-gray-200 rounded animate-pulse w-20"></span>
              </div>
              <button
                className={`flex justify-center items-center w-full  py-2 rounded-full mt-10 text-white   ${items.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {t("proceedToCheckout")}
              </button>

            </div>
          ) : (
            <div className="  p-7  w-full bg-white rounded-3xl ">
              <h1 className="mb-10 text-xl font-bold">{t("cartTotals")} </h1>
              <div className="flex justify-between items-center mb-5">
                <span className="">
                  {" "}
                  {t("Subtotal") + " " + ` [${itemNum}]`}
                </span>
                <span className="font-semibold text-gray-600">
                  {checkoutTotals.subtotal.toLocaleString("en-US") +
                    " " +
                    t("currency")}{" "}
                </span>
              </div>
              <hr className="my-5" />

              {pickupEnabled ? (
                <FulfillmentOptions
                  pickupEnabled={pickupEnabled}
                  fulfillmentType={fulfillmentType}
                  onChange={(nextType) => {
                    setFulfillmentType(nextType);
                    if (nextType !== FULFILLMENT_TYPE.PICKUP) {
                      setPickupPlaceId(null);
                    }
                  }}
                  pickupPlaces={pickupPlaces}
                  pickupPlaceId={pickupPlaceId}
                  onSelectPickupPlace={(place) =>
                    setPickupPlaceId(place.pickupPlaceId)
                  }
                  pickupLoading={pickupLoading}
                  pickupError={pickupError}
                  onRetry={loadPickupPlaces}
                  signedIn={Boolean(userId)}
                />
              ) : null}

              {
                userId ?
                  (<div>
                    {isPickupSelected ? (
                      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <div className="flex justify-between items-start gap-3">
                          <span>{t("pickup_location")}</span>
                          <span className="font-semibold text-gray-600 text-end">
                            {selectedPickupPlace?.name || "—"}
                          </span>
                        </div>
                        {selectedPickupPlace?.address ? (
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {selectedPickupPlace.address}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mb-5">
                        <span className="">{t("ShippingTo")} </span>
                        <span className="font-semibold text-gray-600">{summery.address} </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-5">
                      <span className="">{t("shippingCost")} </span>
                      <span className="font-semibold text-gray-600">
                        {items.length === 0
                          ? 0
                          : checkoutTotals.shippingCost.toLocaleString("en-US") +
                            " " +
                            t("currency")}
                      </span>
                    </div>
                    {isPickupSelected ? (
                      <p className="mb-5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                        {t("pickup_shipping_free")}
                      </p>
                    ) : null}
                  </div>

                  ) : (
                    ""
                  )
              }

              <div className="flex justify-between items-center mb-5">
                <span className="">{t("payment_method")}</span>

                <Select
                  options={paymentMethodOptions}
                  value={paymentMethod}
                  onChange={(selectedOption) => {
                    setPaymentMethod(selectedOption);
                  }}
                  required
                  placeholder={t("select")}
                  className="h-full w-[170px] rounded-2xl border"
                  //  onMenuOpen={() => {}}
                  isSearchable={false}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: "none",
                      boxShadow: "none",
                      background: "transparent",
                      fontWeight: "600",
                      height: "100%",
                      width: "100%",
                    }),
                    option: (provided) => ({
                      ...provided,
                      // backgroundColor: '#b91c1c',
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "600",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#374151",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#dc2626"
                        : state.isFocused
                          ? "#fee2e2"
                          : "#ffffff",
                      color: state.isSelected ? "#ffffff" : "#374151",
                      cursor: "pointer",
                      padding: "10px",
                      "&:hover": {
                        backgroundColor: state.isSelected
                          ? "#dc2626"
                          : "#fee2e2",
                      },
                    }),
                  }}
                />
              </div>

              <hr className="my-6" />
              <div className="flex justify-between items-center text-xl font-semibold">
                <span>{t("Total")} </span>
                <span className="text-[#da643b]">
                  {items.length === 0
                    ? 0
                    : checkoutTotals.netTotal.toLocaleString("en-US") +
                      " " +
                      t("currency")}
                </span>
              </div>
              <button
                disabled={checkoutDisabled}
                className={`flex justify-center items-center w-full  py-2 rounded-full mt-10 text-white 
                    ${checkoutDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E76E7D] hover:bg-[#CD4354]"
                  }`}
                onClick={placeOrder}
              >
                {isFirstAction ? (
                  t("proceedToCheckout")
                ) : loading ? (
                  <LuLoader className="animate-spin" />
                ) : (
                  t("confirmOrder")
                )}
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
