"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaTelegram,
  FaYoutube,
} from "react-icons/fa";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { MdLocalPhone, MdOutlineMailOutline } from "react-icons/md";
import { getRequest } from "../../../utils/requestsUtils";
import { useLanguage } from "../../../context/LanguageContext";
import { useAppConfig, useFeature } from "../../../context/AppConfigContext";
import { IoIosArrowDown, IoIosArrowRoundDown } from "react-icons/io";

const EMPTY_CONTACT = {
  phone: "",
  email: "",
  facebook: "",
  instagram: "",
  x: "",
  whatsApp: "",
  telegram: "",
  youtube: "",
};

const toContactState = (data) => ({
  phone: data?.phone || "",
  email: data?.email || "",
  facebook: data?.facebookURL || "",
  instagram: data?.instagramURL || "",
  x: data?.xurl || "",
  whatsApp: data?.whatsappURL || "",
  telegram: data?.telegramURL || "",
  youtube: data?.youtubeURL || "",
});

export default function Footer({ initialContact = null }) {
  const { t } = useLanguage();
  const wishlistEnabled = useFeature("features.wishlist.enabled");
  const showPoweredBy = useAppConfig("branding.showPoweredBy", false);
  const [contact, setContact] = useState(() =>
    initialContact ? toContactState(initialContact) : EMPTY_CONTACT,
  );
  const [show, setshow] = useState({
    quick_links: false,
    contact_us: false,
    my_account: false,
    customer_service: false,
  })
  useEffect(() => {
    if (initialContact) {
      setContact(toContactState(initialContact));
      return undefined;
    }
    let cancelled = false;
    getRequest(`/api/public/contact`)
      .then((response) => {
        if (!cancelled) setContact(toContactState(response?.data));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialContact]);



  return (
    <div  className="bg-white text-black px-3 py-5 flex flex-col  w-full">
      <div className="flex  md:flex-row xs:flex-col  justify-between md:items-center xs:items-start xs:gap-5">
        <div className="flex items-center justify-start w-full flex-wrap min-w-0">
          <Link prefetch={false} href="/">
            <div className="flex  items-start justify-start w-full ">

              <span className=" relative w-[60px] h-[60px]">
                <Image
                  src="/Images/logo.png"
                  alt="شعار ألفا جروب تكنولوجي"
                  fill
                  sizes="60px"
                  className="object-contain"
                />
              </span>
            </div>
          </Link>
          <div>
            <h2 className="text-4xl font-semibold ">{t("alfa_group")}</h2>
          </div>
        </div>
        <div className="flex justify-between items-center gap-2">
          <Link prefetch={false}
            href={contact.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="فيسبوك"
            className={`w-8 h-8 bg-blue-600 text-white  p-[6px] rounded-full block ${contact.facebook === "" ? "hidden" : "block"
              }`}
          >
            <span>
              <FaFacebookF className="w-full h-full" />
            </span>
          </Link>
          <Link prefetch={false}
            href={contact.whatsApp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="واتساب"
            className={` w-8 h-8 bg-green-600 text-white rounded-full  p-[6px] ${contact.whatsApp === "" ? "hidden" : "block"
              } `}
          >
            <span>
              <FaWhatsapp className="w-full h-full" />
            </span>
          </Link>
          <Link prefetch={false}
            href={contact.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تيليجرام"
            className={` w-8 h-8  bg-blue-600 text-white  p-[6px] rounded-full ${contact.telegram === "" ? "hidden" : "block"
              }`}
          >
            <span>
              <FaTelegram className="w-full h-full" />
            </span>
          </Link>

          <Link prefetch={false}
            href={contact.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="إنستجرام"
            className={` w-8 h-8 bg-pink-600 text-white rounded-full  p-[6px]  ${contact.instagram === "" ? "hidden" : "block"
              }`}
          >
            <span>
              <FaInstagram className="w-full h-full" />
            </span>
          </Link>

          <Link prefetch={false}
            href={contact.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="إكس"
            className={` w-8 h-8 bg-black text-white rounded-full  p-[7px] ${contact.x === "" ? "hidden" : "block"
              }`}
          >
            <span>
              <FaXTwitter className="w-full h-full" />
            </span>
          </Link>
          <Link prefetch={false}
            href={contact.youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="يوتيوب"
            className={` w-8 h-8 rounded-full bg-red-600 text-white p-[6px] ${contact.youtube === "" ? "hidden" : "block"
              }`}
          >
            <span>
              <FaYoutube className="w-full h-full" />
            </span>
          </Link>
        </div>


      </div>

      <hr className="h-px border-0 bg-gray-200 mt-4" />

      <div className="flex  xs:flex-col md:justify-between md:items-start md:flex-row gap-10  my-10  w-full">

        <div className="flex flex-col justify-start items-start gap-3 text-gray-500 w-full">
          <div className="xs:flex justify-between items-center cursor-pointer w-full"
            onClick={() => setshow((prev) => ({
              ...prev,
              quick_links: !prev.quick_links,
              contact_us: false,
              my_account: false,
              customer_service: false
            }))}
          >

            <h2 className="text-xl font-medium  text-black">{t("quick_links")} </h2>
            <span className={`text-black md:hidden transition-transform duration-300 ${show.quick_links ? "rotate-180" : ""
              }`}><IoIosArrowDown /></span>
          </div>
          <div className={`flex-col  gap-2 w-full ${show.quick_links ? "flex duration-500 scale-x-100" : "hidden duration-500 "
            } md:flex`}>
            <Link prefetch={false}
              href={"/"}
              className="hover:text-gray-800"
            >
              {t("homepage")}
            </Link>
            <Link prefetch={false}
              href={"/#FeaturedProducts"}
              className="hover:text-gray-800"
            >
              {t("featured_products")}
            </Link>


            <Link prefetch={false}
              href={"/#CategoriesSection"}
              className="hover:text-gray-800"
            >
              {t("categories")}{" "}
            </Link>
            <Link prefetch={false}
              href={"/user/about"}
              className="hover:text-gray-800"
            >
              {t("about_us")}
            </Link>
          </div>

        </div>
        {/* <hr className="xs:w-full md:w-[1px] xs:h-2 md:h-36 bg-gray-50 "></hr> */}
        <div className="flex flex-col justify-start items-start gap-3 text-gray-500 w-full">
          <div className="xs:flex justify-between items-center cursor-pointer w-full"
            onClick={() => setshow((prev) => ({
              ...prev,
              quick_links: false,
              contact_us: false,
              my_account: false,
              customer_service: !prev.customer_service
            }))}>

            <h2 className="text-xl font-medium  text-black">{t("customer_service")} </h2>
            <span className={`text-black md:hidden transition-transform duration-300 ${show.customer_service ? "rotate-180" : ""
              }`}><IoIosArrowDown /></span>          </div>
          <div className={`flex-col gap-2 w-full ${show.customer_service ? "flex duration-500 scale-x-100" : "hidden duration-500 "
            } md:flex`}>

            <Link prefetch={false}
              href={"/user/ordershistory"}
              className="hover:text-gray-800"
            >
              {t("orders")}{" "}
            </Link>
            <Link prefetch={false}
              href={"/user/returnorders"}
              className="hover:text-gray-8000"
            >
              {t("returns")}{" "}
            </Link>
            <Link prefetch={false}
              href={"/user/about#Guarantee_Policy"}
              className="hover:text-gray-800"
            >
              {t("Guarantee_Policy")}
            </Link>
            <Link prefetch={false}
              href={"/user/about#Return_Policy"}
              className="hover:text-gray-800"
            >
              {t("Return_Policy")}
            </Link>
          </div>
        </div>


        <div className="flex flex-col justify-start items-start gap-3 text-gray-500 w-full">
          <div className="xs:flex justify-between items-center cursor-pointer w-full"
            onClick={() => setshow((prev) => ({
              ...prev,
              quick_links: false,
              contact_us: false,
              my_account: !prev.my_account,
              customer_service: false
            }))}
          >

            <h2 className="text-xl font-medium  text-black">{t("my_account")} </h2>
            <span className={`text-black md:hidden transition-transform duration-300 ${show.my_account ? "rotate-180" : ""
              }`}><IoIosArrowDown /></span>          </div>
          <div className={`flex-col  gap-2 w-full ${show.my_account ? "flex duration-500 scale-x-100" : "hidden duration-500 "
            } md:flex`}>
            <Link prefetch={false}
              href={"/user/profile"}
              className="hover:text-gray-800"
            >
              {t("view_profile")}{" "}
            </Link>
            {wishlistEnabled ? (
              <Link prefetch={false}
                href={"/user/wishlist"}
                className="hover:text-gray-800"
              >
                {" "}
                {t("wishlist")}{" "}
              </Link>
            ) : null}
            <Link prefetch={false}
              href={"/user/cart"}
              className="hover:text-gray-800"
            >
              {" "}
              {t("shoppingCart")}{" "}
            </Link>
          </div>
        </div>
        <div className="flex flex-col justify-start items-start gap-3 text-gray-500 w-full">
          <div className="xs:flex justify-between items-center cursor-pointer w-full"
            onClick={() => setshow((prev) => ({
              ...prev,
              quick_links: false,
              contact_us: !prev.contact_us,
              my_account: false,
              customer_service: false
            }))}
          >

            <h2 className="text-xl font-medium  text-black">{t("contact_us")} </h2>
            <span className={`text-black md:hidden transition-transform duration-300 ${show.contact_us ? "rotate-180" : ""
              }`}><IoIosArrowDown /></span>
          </div>
          <div className={`flex-col  gap-2 w-full ${show.contact_us ? "flex duration-500 scale-x-100" : "hidden duration-500 "
            } md:flex`}>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg text-black ${contact.email === "" ? "hidden" : "block"
                  }`}
              >
                <MdOutlineMailOutline />
              </span>
              <span className="text-base">{contact.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-lg text-black ${contact.phone === "" ? "hidden" : "block"
                  }`}
              >
                <MdLocalPhone />
              </span>
              <span className="">{contact.phone}</span>
            </div>
          </div>
        </div>
      </div>
      <hr className="h-px  border-0 bg-gray-200 " />
      {showPoweredBy ? (
        <div className="flex justify-center items-center w-full mt-4">
          <h2> {<div>  Designed & Developed by | <span className="font-semibold">BlueSoft</span> © {new Date().getFullYear()} </div>}   </h2>
        </div>
      ) : null}
    </div>
  );
}
