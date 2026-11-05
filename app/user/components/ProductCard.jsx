import { useIdContext } from "../../../context/idContext";
import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { deleteRequest, postRequest } from "../../../utils/requestsUtils";
import { useLanguage } from "../../../context/LanguageContext";
import { useRouter } from "next/navigation";
import { useRefresh } from "../../../context/refreshContext";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getThumbnailUrl } from "../../../utils/functions";
import {  IoMdHeart } from "react-icons/io";
import StarRating from "./StarRating"
import { useCartDrawerOpen } from "../../../context/CartDrawerOpenContext";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useRef } from "react";
import { productPath, categoryPath } from "../../../lib/seo";

export default function ProductCard({ productInfo, favorite, priority = false }) {
  const { setSelectedProductId } = useIdContext();
  const navigate = useRouter();
  const { t } = useLanguage();
  const swiperRef = useRef(null);
  const imageAreaRef = useRef(null);
  const [swiperActive, setSwiperActive] = useState(Boolean(priority));
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState();
  const { locale } = useLanguage();
  const { triggerRefresh } = useRefresh();
  const { setIsCartOpen } = useCartDrawerOpen();
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  useEffect(() => {
    if (swiperActive) return undefined;

    const node = imageAreaRef.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setSwiperActive(true);
      return undefined;
    }

    // Product cards can be far below the fold. Keep the first image static
    // until the card is near the viewport, then initialize Swiper once.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSwiperActive(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [swiperActive]);

  const addToCart = async (productId) => {
    try {
      if (userId) {
        if (productInfo.available) {
          await postRequest(
            `/api/shopCarts/addLine`,
            {
              itemId: productId,
              quantity: 1,
            },
            "",
          );
        }
        triggerRefresh();
        // const result = await Swal.fire({
        //   icon: "success",
        //   title: t("تم إضافة المنتج الى سلة التسوق"),
        //   showCancelButton: true,
        //   confirmButtonText: t("goToCart"),
        //   cancelButtonText: t("continueShopping"),
        //   customClass: {
        //     popup: "rounded-xl shadow-lg border border-gray-200 p-6",
        //     title: "text-xl font-bold text-gray-800 mb-2",
        //     content: "text-sm text-gray-600 mb-4",
        //     confirmButton:
        //       "bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2 rounded-lg",
        //     cancelButton:
        //       "bg-gray-500 hover:bg-gray-400 text-w  font-medium px-6 py-2 rounded-lg ml-2",
        //   },
        // });
        // if (result.isConfirmed) {
        //   navigate.push("/user/cart");
        // }
      } else {
        const product = {
          id: productId,
          quantity: 1,
        };

        let cart = JSON.parse(localStorage.getItem("cart") || "[]");

        const existingItem = cart.find((item) => item.id === productId);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push(product);
        }
        triggerRefresh();
        localStorage.setItem("cart", JSON.stringify(cart));
        // const result = await Swal.fire({
        //   icon: "success",
        //   title: t("تم إضافة المنتج الى سلة التسوق"),
        //   showCancelButton: true,
        //   confirmButtonText: t("goToCart"),
        //   cancelButtonText: t("continueShopping"),
        //   customClass: {
        //     popup: "rounded-xl shadow-lg border border-gray-200 p-6",
        //     title: "text-xl font-bold text-gray-800 mb-2",
        //     content: "text-sm text-gray-600 mb-4",
        //     confirmButton:
        //       "bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2 rounded-lg",
        //     cancelButton:
        //       "bg-gray-500 hover:bg-gray-400 text-w  font-medium px-6 py-2 rounded-lg ml-2",
        //   },
        // });
        // if (result.isConfirmed) {
        //   navigate.push("/user/cart");
        // }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const addFavoriteItems = async (productId) => {
    if (userId) {
      await postRequest(
        `/api/users/favoriteItems/${productId}`,
        "",
        "",
        true
      );
    } else {
      const product = {
        id: productId,
      };

      let favoriteItems = JSON.parse(
        localStorage.getItem("favoriteItems") || "[]",
      );

      const existingItem = favoriteItems.find((item) => item.id === productId);

      if (existingItem) {
      } else {
        favoriteItems.push(product);
        toast.success("تم اضافة المنتج بنجاح");
      }

      localStorage.setItem("favoriteItems", JSON.stringify(favoriteItems));
    }
  };

  const deleteFavoriteItems = async (productId) => {
    try {
      setLoading(true);

      const res = await deleteRequest(
        `/api/users/favoriteItems/${productId}`,
        t("message"),
      );
      // triggerRefresh();
      if (res.success === true) {
        const divProductId = document.querySelector(
          `#div_${productInfo.itemId}`,
        );
        divProductId.classList.add("hidden");
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  // const describtion =
  // productInfo?.[locale === "ar" ? "descriptionAr" : "descriptionEn"] || "";
  const productName = locale === "ar" ? productInfo?.nameAr : productInfo?.nameEn;
  const displayName = productName || productInfo?.nameEn || productInfo?.nameAr || "منتج";
  const productHref = productPath(productInfo);
  const categoryHref = productInfo?.itemCategory
    ? categoryPath(productInfo.itemCategory)
    : null;

  // Single handler for the whole card: clicking any part of the card opens the
  // product details (image, name, category, prices, badges).
  const openProductDetails = () => {
    setSelectedProductId(productInfo?.itemId);
    navigate.push(productHref);
  };

  return (
    <div
      id={`div_${productInfo?.itemId}`}
      className="min-h-[360px] h-auto group relative bg-white py-2 w-full min-w-0 rounded-3xl cursor-pointer "
      onClick={openProductDetails}
    >
      <div className="flex flex-col justify-around gap-3 items-center h-full min-w-0">
        <div className="relative w-full aspect-square max-h-[380px] p-1 shrink-0 ">
          <div className="relative w-full h-full">

            <div className="absolute top-3 start-3 text-sm flex flex-col items-start gap-1 z-30 max-w-full "
            >
              {productInfo?.available ?
                <div className=" flex flex-col gap-1">
                  {productInfo?.oldPrice ? (
                    <span className="font-semibold flex justify-center items-center text-center bg-[#8CBC67] text-xs min-w-[48px] px-2 h-6 text-white rounded-full whitespace-nowrap">
                      {" - " +
                        (
                          ((productInfo?.oldPrice - productInfo?.price) /
                            productInfo?.oldPrice) *
                          100
                        ).toFixed(0)}
                      %
                    </span>
                  ) : (
                    ""
                  )}
                  {productInfo?.createdDate && new Date(productInfo?.createdDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ?
                    (<span className="font-semibold flex justify-center items-center text-center bg-[#CD4354] text-xs min-w-[48px] px-2 h-6 text-white rounded-full whitespace-nowrap">
                      {t("hot")}
                    </span>) : ("")}

                </div>


                : <span className="font-semibold flex justify-center items-center text-center bg-black text-xs min-w-[56px] px-2 h-6 text-white rounded-full whitespace-nowrap">
                  {t("soldOut")}
                </span>}

            </div>
            <div className="w-full h-full flex justify-center px-1 items-center rounded-3xl z-10">
              <div ref={imageAreaRef} className=" h-full w-full relative   bg-white rounded-3xl">
                {swiperActive ? (
                <Swiper
                  key={locale}
                  slidesPerView={1}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  spaceBetween={10}
                  className="relative w-full h-full select-none rounded-3xl"
                >
                  {productInfo?.images?.map((img, index) => (
                    <SwiperSlide className="rounded-3xl z-50" key={img?.imageUrl || index}
                    >
                      <Link
                        href={productHref}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={displayName}
                        className="relative block h-full w-full"
                      >
                        <Image
                          src={
                            `${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                              img?.imageUrl
                            )}` || ""
                          }
                          alt={`${displayName} - ${locale === "ar" ? "صورة" : "image"} ${index + 1}`}
                          fill
                          priority={priority && index === 0}
                          quality={85}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain rounded-3xl"
                        />
                      </Link>
                    </SwiperSlide>
                  ))}
                  {/* Hover Zones */}
                  <div className="absolute inset-0 z-40 lg:flex xs:hidden">
                    {productInfo?.images?.map((img, index) => (
                      <div
                        key={img?.imageUrl || index}
                        className="flex-1 h-full hover:text-gray-500"
                        onMouseEnter={() => {
                          swiperRef.current?.slideTo(index);
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="
    absolute bottom-0 left-0
    w-full
    z-50
    lg:opacity-0 lg:invisible
    lg:group-hover:opacity-100 lg:group-hover:visible
    xs:opacity-100 xs:visible
    transition-all duration-300
  "
                  >
                    {/* Indicators */}
                    <div className="w-full ">
                      <div className="w-full flex justify-between gap-1">
                        {productInfo?.images?.map((img, index) => (
                          <span
                            key={img?.imageUrl || index}
                            className="w-full h-1 rounded-full bg-gray-300 "
                          />
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="w-full">
                      <div
                        className="
        flex items-center justify-center
        w-full
        bg-[#E76E7D]
        rounded-b-3xl
        overflow-hidden
      "
                      >
                        {/* Wishlist */}
                        <button
                          id={`btn_fov_${productInfo?.itemId}`}
                          className="
          group/wishlist
          flex items-center justify-center
          text-white
          w-full
          py-2
          text-xs
          transition-all duration-300
          hover:bg-[#CD4354]
        "
                          onClick={(e) => {
                            e.stopPropagation();

                            if (favorite === true) {
                              deleteFavoriteItems(productInfo?.itemId);
                            } else {
                              addFavoriteItems(productInfo?.itemId);
                            }

                            setSelectedProductId(productInfo?.itemId);
                          }}
                        >
                          <IoMdHeart
                            className="
            absolute
            w-5 h-5
            lg:scale-0
            transition-all duration-300
            lg:translate-y-10
            lg:group-hover/wishlist:-translate-y-0
            lg:group-hover/wishlist:scale-100
            xs:scale-100
          "
                          />

                          <span
                            className="
            transition-all duration-300
            lg:opacity-100
            lg:group-hover/wishlist:-translate-y-5
            lg:group-hover/wishlist:opacity-0
            xs:opacity-0
          "
                          >
                            {t("wishlist")}
                          </span>
                        </button>

                        {/* Add To Cart */}
                        {productInfo?.available && (
                          <button
                            className="
            group/cart
            flex items-center justify-center
            text-white
            w-full
            py-2
            text-xs
            transition-all duration-300
            hover:bg-[#CD4354]
          "
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(productInfo?.itemId);
                              setIsCartOpen(true);
                            }}
                          >
                            <span
                              className="
              transition-all duration-300
              lg:opacity-100
              lg:group-hover/cart:-translate-y-5
              lg:group-hover/cart:opacity-0
              xs:opacity-0
            "
                            >
                              {t("Cart")}
                            </span>

                            <MdOutlineAddShoppingCart
                              className="
              absolute
              w-5 h-5
              lg:scale-0
              transition-all duration-300
              lg:translate-y-10
              lg:group-hover/cart:translate-y-0
              lg:group-hover/cart:scale-100
              xs:scale-100
            "
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Swiper>
                ) : (
                  <div className="relative w-full h-full select-none rounded-3xl">
                    {productInfo?.images?.[0] ? (
                      <Link
                        href={productHref}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={displayName}
                        className="relative block h-full w-full"
                      >
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${getThumbnailUrl(
                            productInfo.images[0].imageUrl
                          )}`}
                          alt={`${displayName} - ${locale === "ar" ? "صورة" : "image"} 1`}
                          fill
                          priority={priority}
                          quality={85}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain rounded-3xl"
                        />
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
<div className="flex flex-col gap-2 items-center justify-center min-w-0 w-full"
        >
        <div className="w-full flex flex-col justify-center items-center min-w-0">
          <h2
            className="text-sm font-bold break-words text-center w-full"
          >
            <Link
              href={productHref}
              onClick={(event) => event.stopPropagation()}
              className="transition-colors hover:text-[#E14A5C]"
            >
              {displayName?.length <= 29
                ? displayName
                : displayName?.slice(0, 29) + " ..."}
            </Link>
          </h2>
          <div className="flex justify-center items-cente text-gray-500 text-sm">
            {categoryHref ? (
              <Link
                href={categoryHref}
                onClick={(event) => event.stopPropagation()}
                className="transition-colors hover:text-[#E14A5C]"
              >
                {locale === "ar"
                  ? productInfo?.itemCategory?.nameAr
                  : productInfo?.itemCategory?.nameEn}
              </Link>
            ) : (
              locale === "ar"
                ? productInfo?.itemCategory?.nameAr
                : productInfo?.itemCategory?.nameEn
            )}
            {" "}
          </div>

        </div>

        <div>{
          productInfo?.averageRating === 0 ? "" :<StarRating rating={productInfo?.averageRating || 0} />
          }
          
        </div>

        <div className="w-full">
          <div className="flex w-full justify-center items-center">
            {productInfo?.available ? (
              <div
                className="flex flex-col w-full"

              >

                <div className="flex  justify-center gap-2 items-center flex-wrap ">
                  {productInfo?.oldPrice ? (
                    <div className="flex gap-2">
                      <span className=" line-through text-sm  flex text-gray-400">
                        {productInfo?.oldPrice.toLocaleString("en-US")}{" "}{t("currency")}
                      </span>
                    </div>
                  ) : (
                    ""
                  )}
                  <span className=" font-semibold text-red-600 break-words text-center ">
                    {productInfo?.price.toLocaleString("en-US")}.00 {t("currency")}
                  </span>

                </div>
              </div>
            ) : (
              <div className="w-full  h-full"></div>
            )}
            {/* {productInfo?.available ? (
              ""
            ) : (
             
            )} */}

          </div>

        </div>

      </div>
      </div>
    </div>
    // </div>
  );
}
