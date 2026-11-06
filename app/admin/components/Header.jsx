"use client";
import { useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext.js";
import { postRequest } from "../../../utils/requestsUtils.js";
import { useNamePageInAdminContext } from "../../../context/namePageInAdmin.jsx";
import { MdLanguage } from "react-icons/md";

export default function Header({ page_title }) {
  const { locale, setLocale } = useLanguage();
  const { selectedNamePage, setSelectedNamePage } = useNamePageInAdminContext();
  const { t } = useLanguage();

  switch (selectedNamePage) {
    case "Categories Management":
      setSelectedNamePage("categories_management");
      break;
    case "Products Management":
      setSelectedNamePage("products_management");

      break;
    case "Orders Management":
      setSelectedNamePage("orders_management");
      break;
    case "Dashboard Overview":
      setSelectedNamePage("dashboard_overview");
      break;
    case "Homepage Management":
      setSelectedNamePage("homepage_management");
      break;
    case "Users Management":
      setSelectedNamePage("users_management");
      break;
    case "Admins Management":
      setSelectedNamePage("admins_management");
      break;
    case "Contact Management":
      setSelectedNamePage("contact_management");
      break;
    case "Returns Management":
      setSelectedNamePage("returns_management");
      break;
    case "ShippingCost Management":
      setSelectedNamePage("ShippingCost_management");
      break;
  }

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : "";

 const changeLanguage = async (newLang) => {
    const validLangs = ["ar", "en"];

    if (!validLangs.includes(newLang)) return;
    setLocale(newLang);
    try {
      await postRequest(`/api/users/language/${newLang}`, "", "");
      setLocale(newLang);

      localStorage.setItem("lang", newLang);
    } catch (err) {
      console.error("Failed to update language", err);
    }
  };
  const lang =
    typeof window !== "undefined" ? localStorage.getItem("lang") : "";
  // useEffect(() => {
  //   let en = document.querySelector("#en");
  //   let ar = document.querySelector("#ar");

  //   if (lang === "en") {
  //     en.classList.add("bg-red-600");
  //     ar.classList.add("bg-red-200");

  //     en.classList.remove("bg-red-200");
  //     ar.classList.remove("bg-red-600");
  //   } else {
  //     ar.classList.add("bg-red-600");
  //     en.classList.add("bg-red-200");
  //     en.classList.remove("bg-red-600");
  //     ar.classList.remove("bg-red-200");
  //   }
  // });

  return (
    <header className="md:min-h-[70px] xs:min-h-[50px] h-auto flex flex-wrap justify-between items-center gap-2 px-5 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] font-semibold w-full bg-[#204272] text-white border-b-[1px]">
      <h1 id="page-title" className="md:text-2xl xs:text-lg break-words min-w-0 ">
        {t(selectedNamePage)}
      </h1>
      <button
        onClick={() => {
          const newLocale = locale === "ar" ? "en" : "ar";
          setLocale(newLocale);
          changeLanguage(newLocale);
        }}
      >
        <MdLanguage className="w-7 h-7 " />
      </button>
    </header>
  );
}
