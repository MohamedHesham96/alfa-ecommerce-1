"use client";
import Image from "next/image";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { FaLeaf } from "react-icons/fa";
import { HiLightBulb } from "react-icons/hi";
import { IoHeart, IoShieldCheckmark } from "react-icons/io5";
import { TbTruckReturn } from "react-icons/tb";
import { useLanguage } from "../../../../context/LanguageContext";

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="w-full bg-white">
      <div className="w-full flex flex-col justify-center text-center h-full py-20">
        <h1 className="text-5xl font-bold  text-center mt-5">
          <span className=" ">
            {" "}
            <span>{t("about_hero_title_1")}</span> <br />{" "}
            <span className="text-red-700"> {t("about_hero_title_2")}</span>
          </span>
        </h1>
        <h1 className="text-lg text-gray-600 mt-10">
          {t("about_hero_subtitle")}
        </h1>
      </div>
      <div className="w-full bg-[#f5f7f5] py-20  mt-10">
        <div className="flex md:flex-row xs:flex-col items-center justify-center gap-5">
          <Image
            src="/Images/23@4x.png"
            alt={t("about_us_image")}
            width={500}
            height={500}
            className="w-[400px] h-[400px] rounded-3xl"
            priority
          />
          <div className="md:w-[600px] xs:w-[400px] h-full p-5">
            <div>
              <h1 className="font-semibold text-lg">
                {t("about_who_title")}
              </h1>
              <p className="text-sm font-semibold text-gray-600">
                {t("about_who_body")}
              </p>
            </div>
            <div className="mt-10">
              <h1 className="font-semibold text-lg">
                {t("about_mission_title")}
              </h1>
              <p className="text-sm font-semibold text-gray-600">
                {t("about_mission_body")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#eff1ef] md:p-28 xs:p-10 flex flex-col gap-5 ">
        <div
          id="Guarantee_Policy"
          className="bg-white h-full flex flex-col rounded-2xl p-4"
        >
          <div className="flex  items-center gap-3">
            <div className="w-[40px] h-[40px] bg-red-200 rounded-full flex items-center justify-center">
              <AiFillSafetyCertificate className="text-2xl text-red-700" />
            </div>
            <span className="font-semibold">
              {t("Guarantee_Policy")}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-600 whitespace-pre-wrap  mt-5">
            {t("about_guarantee_body")}
          </span>
        </div>
        <div
          id="Return_Policy"
          className="bg-white h-full flex flex-col rounded-2xl p-4"
        >
          <div className="flex  items-center gap-3">
            <div className="w-[40px] h-[40px] bg-red-200 rounded-full flex items-center justify-center">
              <TbTruckReturn className="text-2xl text-red-700" />
            </div>{" "}
            <span className="font-semibold">
              {t("Return_Policy")}
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-600 whitespace-pre-wrap break-words  mt-5">
            {t("about_return_body")}
          </p>
        </div>
      </div>
      <div className="w-full bg-[#f5f7f5] md:p-28 xs:p-10  text-center ">
        <h1 className="text-2xl font-bold">
          {t("about_values_title")}
        </h1>
        <div className="grid md:grid-cols-4 xs:grid-cols-2 gap-5 mt-16">
          <div className="flex flex-col items-center justify-center gap-3 bg-white p-5 rounded-lg">
            <div className="w-[50px] h-[50px] bg-red-200 rounded-full flex items-center justify-center">
              <IoShieldCheckmark className="text-2xl text-red-700" />
            </div>
            <h1 className="font-semibold md:text-base xs:text-sm">
              {t("about_quality_title")}
            </h1>
            <h1 className="font-semibold md:text-sm xs:text-[10px] text-gray-600">
              {t("about_quality_body")}
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 bg-white p-5 rounded-lg">
            <div className="w-[50px] h-[50px] bg-red-200 rounded-full flex items-center justify-center">
              <HiLightBulb className="text-3xl text-red-700" />
            </div>
            <h1 className="font-semibold  md:text-base xs:text-sm ">
              {t("about_innovation_title")}
            </h1>
            <h1 className="font-semibold  md:text-sm xs:text-[10px] text-gray-600">
              {t("about_innovation_body")}
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 bg-white p-5 rounded-lg">
            <div className="w-[50px] h-[50px] bg-red-200 rounded-full flex items-center justify-center">
              <IoHeart className="text-2xl text-red-700" />
            </div>
            <h1 className="font-semibold md:text-base xs:text-sm">
              {t("about_customer_first_title")}
            </h1>
            <h1 className="font-semibold  md:text-sm xs:text-[10px] text-gray-600">
              {t("about_customer_first_body")}
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 bg-white p-5 rounded-lg">
            <div className="w-[50px] h-[50px] bg-red-200 rounded-full flex items-center justify-center">
              <FaLeaf className="text-2xl text-red-700" />
            </div>
            <h1 className="font-semibold  md:text-base xs:text-sm">
              {t("about_sustainability_title")}
            </h1>
            <h1 className="font-semibold  md:text-sm xs:text-[10px] text-gray-600">
              {t("about_sustainability_body")}
            </h1>
          </div>
        </div>
      </div>
      <div className="bg-white text-center md:p-28 xs:p-10">
        <h1 className="text-2xl font-bold">
          {t("about_team_title")}
        </h1>

        <h1 className="text-gray-600 text-sm font-semibold mt-5 ">
          {t("about_team_subtitle")}
        </h1>
        <div className="grid md:grid-cols-4 xs:grid-cols-2 gap-10 mt-20 ">
          <div className="flex flex-col text-center">
            <Image
              src="/Images/unnamed.png"
              alt={t("team_member_photo")}
              width={250}
              height={350}
              className="w-full h-full rounded-xl"
            />
            <span>Julian Thorne</span>
            <span className="text-sm font-semibold text-gray-400">
              {t("cto")}
            </span>
          </div>

          <div className="flex flex-col text-center">
            <Image
              src="/Images/unnamed.png"
              alt={t("team_member_photo")}
              width={250}
              height={350}
              className="w-full h-full rounded-xl"
            />
            <span>Julian Thorne</span>
            <span className="text-sm font-semibold text-gray-400">
              {t("cto")}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <Image
              src="/Images/unnamed.png"
              alt={t("team_member_photo")}
              width={250}
              height={350}
              className="w-full h-full rounded-xl"
            />
            <span>Julian Thorne</span>
            <span className="text-sm font-semibold text-gray-400">
              {t("cto")}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <Image
              src="/Images/unnamed.png"
              alt={t("team_member_photo")}
              width={250}
              height={350}
              className="w-full h-full rounded-xl"
            />
            <span>Julian Thorne</span>
            <span className="text-sm font-semibold text-gray-400">
              {t("cto")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
