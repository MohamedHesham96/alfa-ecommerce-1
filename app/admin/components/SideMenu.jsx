"use client";
import { MdDashboard } from "react-icons/md";
import { IoFileTray } from "react-icons/io5";
import { MdOutlineShoppingCart } from "react-icons/md";
import { ImUsers } from "react-icons/im";
import { MdContactSupport } from "react-icons/md";
import { MdAdminPanelSettings } from "react-icons/md";
import { RiMoneyDollarCircleLine, RiPagesFill } from "react-icons/ri";
import { MdElectricBolt } from "react-icons/md";
import { MdCategory } from "react-icons/md";
import { MdSettings } from "react-icons/md";
import { MdStorefront } from "react-icons/md";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useLanguage } from "../../../context/LanguageContext.js";
import Image from "next/image.js";
import { PiSignOutBold } from "react-icons/pi";

import { useNamePageInAdminContext } from "../../../context/namePageInAdmin.jsx";
import { useAppConfig } from "../../../context/AppConfigContext.jsx";
import { useRouter } from "next/navigation.js";
import { logoutRequest } from "../../../utils/requestsUtils";
import { TbTruckReturn } from "react-icons/tb";
export default function SideMenu() {
  const navigate = useRouter();

  const [username, setUsername] = useState();
  const [systemSettingsAccess, setSystemSettingsAccess] = useState(false);
  const { selectedNamePage, setSelectedNamePage } = useNamePageInAdminContext();
  const pickupEnabled = useAppConfig("pickup.enabled", false);
  useEffect(() => {
    // Only BlueSoft-managed accounts may see the System Settings entry.
    setSystemSettingsAccess(
      typeof window !== "undefined" &&
        localStorage.getItem("systemSettingsAccess") === "true",
    );
  }, []);
  useEffect(() => {
    // جلب اسم المستخدم من localStorage
    const savedUsername =
      typeof window !== "undefined"
        ? localStorage.getItem("firstName")
        : null + " " + typeof window !== "undefined"
        ? localStorage.getItem("lastName")
        : null;
    setUsername(savedUsername);
    const lastPort = window.location.pathname.split("/").filter(Boolean).pop();
    setSelectedNamePage(
      lastPort === "Dashboard"
        ? lastPort + " " + "Overview"
        : window.location.pathname.includes("User")
        ? "Users Management"
        : window.location.pathname.includes("orders")
        ? "Orders Management"
        : window.location.pathname.includes("returnorderdetails")
        ? "Returns Management"
        : window.location.pathname.includes("SystemSettings")
        ? "System Settings"
        : window.location.pathname.includes("PickupPlaces")
        ? "Pickup Places Management"
        : lastPort + " " + "Management"
    );
  }, [setSelectedNamePage]);

  // const username =
  //  typeof window !== 'undefined'? localStorage.getItem("firstName") + " " + localStorage.getItem("lastName"):null;
  // const adminId = localStorage.getItem("id");

  const { t } = useLanguage();
  // const checkAdmin = useCallback(() => {
  //   const dashboardTab = document.querySelector("#dashboardTabTab");
  //   const adminsTab = document.querySelector("#adminsTab");
  //   if (adminId != "1") {
  //     dashboardTab.classList.add("hidden");
  //     adminsTab.classList.add("hidden");
  //   }
  // },[adminId])
  // useEffect(()=>{
  //   checkAdmin()
  // },[checkAdmin])
  return (
    <div className="xs:w-[60px] xl:w-[300px] min-h-screen bg-[#204272] text-white  ">
      <div className=" h-full  ">
        <div className="flex  items-center xs:justify-center xl:justify-start xl:mx-5 xs:mx-0 gap-1 mt-2">
          <span className="p-2 rounded-md  ">
            <Image
              src="/Images/logo.png"
              alt="logo"
              width={35}
              height={35}
              priority
            />
          </span>
          <div className="cursor-default xl:block xs:hidden">
            <h1 className="text-md   font-semibold font-sans">
              <span className="text-sm  font-bold">
                {username === "" ? "" : username}
              </span>
            </h1>
            <h1 className="text-xs ">{t("super_admin")}</h1>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-1 ">
          <Link
            href="/admin/Dashboard"
            onClick={() => setSelectedNamePage("Dashboard Overview")}
          >
            <div
              id="dashboardTab"
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start  items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "dashboard_overview"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <MdDashboard />
              </span>
              <h1 className="text-md xs:hidden xl:block ">{t("dashboard")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/Homepage"
            onClick={() => setSelectedNamePage("Homepage Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start  items-center p-3 rounded-md  cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "homepage_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <RiPagesFill />
              </span>
              <h1 className="text-md xs:hidden xl:block ">{t("homepage")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/Categories"
            onClick={() => setSelectedNamePage("Categories Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start  items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "categories_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <MdCategory />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("categories")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/Products"
            onClick={() => setSelectedNamePage("Products Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md cursor-pointer  hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "products_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <IoFileTray />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("products")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/orders"
            onClick={() => setSelectedNamePage("Orders Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md  cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "orders_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <MdOutlineShoppingCart />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("orders")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/Returns"
            onClick={() => setSelectedNamePage("Returns Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md  cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "returns_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <TbTruckReturn  />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("returns")}</h1>
            </div>
          </Link>
 <Link
            href="/admin/ShippingCost"
            onClick={() => setSelectedNamePage("ShippingCost Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "ShippingCost_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl">
                <RiMoneyDollarCircleLine  />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("shippingcost")}</h1>
            </div>
          </Link>
          {systemSettingsAccess ? (
            <Link
              href="/admin/SystemSettings"
              onClick={() => setSelectedNamePage("System Settings")}
            >
              <div
                className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                   ${
                     selectedNamePage === "system_settings"
                       ? "bg-red-100 text-red-500"
                       : ""
                   }`}
              >
                <span className="text-2xl">
                  <MdSettings />
                </span>
                <h1 className="text-md xs:hidden xl:block">{t("system_settings")}</h1>
              </div>
            </Link>
          ) : null}

          {pickupEnabled ? (
            <Link
              href="/admin/PickupPlaces"
              onClick={() => setSelectedNamePage("Pickup Places Management")}
            >
              <div
                className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                   ${
                     selectedNamePage === "pickup_places_management"
                       ? "bg-red-100 text-red-500"
                       : ""
                   }`}
              >
                <span className="text-2xl">
                  <MdStorefront />
                </span>
                <h1 className="text-md xs:hidden xl:block">{t("pickup_places")}</h1>
              </div>
            </Link>
          ) : null}

          <Link
            href="/admin/UsersPage/Users"
            onClick={() => setSelectedNamePage("Users Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start  items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "users_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl ">
                <ImUsers />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("users")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/Admins"
            onClick={() => setSelectedNamePage("Admins Management")}
          >
            <div
              id="adminsTab"
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start  items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "admins_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl">
                <MdAdminPanelSettings />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("admins")}</h1>
            </div>
          </Link>

          <Link
            href="/admin/Contact"
            onClick={() => setSelectedNamePage("Contact Management")}
          >
            <div
              className={`flex gap-4 mx-3 xs:justify-center xl:justify-start items-center p-3 rounded-md cursor-pointer hover:bg-red-100 hover:text-red-500
                 ${
                   selectedNamePage === "contact_management"
                     ? "bg-red-100 text-red-500"
                     : ""
                 }`}
            >
              <span className="text-2xl">
                <MdContactSupport />
              </span>
              <h1 className="text-md xs:hidden xl:block">{t("contact")}</h1>
            </div>
          </Link>

          
          <hr className="my-6"></hr>
          <div
            className={`flex gap-4 mx-3 mb-5  xs:justify-center xl:justify-start items-center rounded-md cursor-pointer text-red-500 `}
            onClick={async () => {
              await logoutRequest();
              localStorage.setItem("id", "");
              localStorage.setItem("accessToken", "");
              localStorage.setItem("refreshToken", "");
              localStorage.setItem("address", "");
              localStorage.setItem("email", "");
              localStorage.setItem("firstName", "");
              localStorage.setItem("lastName", "");
              localStorage.setItem("phone", "");
              localStorage.setItem("role", "");
              localStorage.setItem("systemSettingsAccess", "false");
              localStorage.setItem("username", "");
              navigate.push("/");
            }}
          >
            <span className="text-2xl">
              <PiSignOutBold />
            </span>
            <h1 className="text-md xs:hidden xl:block"> {t("logout")}</h1>
          </div>
        </div>
     
      </div>
    </div>
  );
}
