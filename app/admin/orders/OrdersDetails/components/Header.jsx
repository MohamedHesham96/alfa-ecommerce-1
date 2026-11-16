"use client";
import { useLanguage } from "../../../../../context/LanguageContext";
import { getRequest, postRequest } from "../../../../../utils/requestsUtils.js";
import { useEffect, useState } from "react";
import { useOrderDetailsContext } from "../../../../../context/orderDetailsContext.jsx";
import { useRouter } from "next/navigation";
import { MdCancel } from "react-icons/md";

export default function Orders_Details({ orderId, orderType }) {
  const { t } = useLanguage();
  const { selectedOrderCode } = useOrderDetailsContext();
  const { selectedOrderDate } = useOrderDetailsContext();
  const { selectedOrderState } = useOrderDetailsContext();

  const date = new Date(selectedOrderDate);
  const fullDateTime = date.toLocaleDateString("en-GB");
  const router = useRouter();

  const orderCancel = async () => {
    try {
      if(orderType === "orders"){
              await postRequest(`/api/admin/orders/${orderId}/changeState/CANCELLED`, "", t("message"));
      }
      else {
        
      }
      router.refresh();
    } catch (error) {
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full gap-3">
        <h1 className="md:text-3xl  xs:text-xl font-semibold">
          {" "}
          {selectedOrderCode} #
        </h1>
        {selectedOrderState === "CANCELLED"  ? (
          <span
            className={`xs:text-xs md:text-sm flex items-center justify-center  
              text-red-700 bg-red-100 
           font-semibold py-2 px-4 text-center rounded-3xl gap-2`}
          >
            {" "}
            <MdCancel className="text-lg" /> {t(selectedOrderState)}{" "}
          </span>
        ) : 
        selectedOrderState === "DELIVERED" || selectedOrderState === "REFUNDED" || orderType !== 'orders'  ? 
        " ":
        (
          <button
            className={`xs:text-xs md:text-sm flex items-center justify-center  
              text-red-700 bg-red-100 hover:bg-red-200  border border-red-700  
           font-semibold py-2 px-4 text-center rounded-3xl`}
            onClick={orderCancel}
          >
            {t("order_cancel")}
          </button>
        )}
      </div>
      <h1 className="text-xs text-gray-600 mt-3">
        {t("Placed_on")} {fullDateTime}
      </h1>
    </div>
  );
}
