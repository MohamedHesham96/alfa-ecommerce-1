"use client";
import Image from "next/image";
import { useLanguage } from "../../context/LanguageContext";
import { FaCheckCircle } from "react-icons/fa";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function ConfirmedEmailPage() {
    const [count, setCount] = useState(5);
  const router = useRouter();
  const { t } = useLanguage();
  //   useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCount((prev) => {
  //       if (prev === 1) {
  //         clearInterval(timer);
  //         router.push("/");
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [router]);
  return (
    <div className="">
      <header className="h-14 w-full bg-red-700">
        <div className="flex  items-center  ">
                   <span className="w-12 h-12 ">
                     <Image
                       src="/Images/logo.png"
                       alt="Alfa"
                       width={50}
                       height={50}
                       priority
                       className="w-full h-full"
                     />
                   </span>
                   <div className="cursor-default">
                     <h1 className="lg:text-xl  xs:text-lg w-[120px] text-white font-bold font-sans">
                       {t("alfa_group")}
                     </h1>
                   </div>
                 </div>
      </header>
      <div className="flex flex-col gap-10 justify-center items-center mt-24">
        <div className="md:w-72 md:h-72 xs:w-60 xs:h-60 rounded-full bg-green-700 text-center flex items-center justify-center">
          <FaCheckCircle className="md:w-[200px] md:h-[200px] xs:w-[150px] xs:h-[150px] text-white" />
        </div>
        <h1 className="md:text-6xl xs:text-4xl font-bold "> {t("account_activated_successfully")} </h1>
        <h2></h2>
      </div>
      <div className="flex items-center justify-center text-center">
        <h1 className="rounded-full  xs:text-sm md:text-base bg-gray-100 py-3  px-5">{t("redirect_home_message" )+ " " +count }</h1>
      </div>
    </div>
  );
}