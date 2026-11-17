"use client";
import React, { useEffect, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { getRequest } from "../../../../utils/requestsUtils.js";
import { FaBox, FaCheck, FaShoppingBag, FaTimes, FaTruck } from "react-icons/fa";
import StatCard from "../../components/ui/StatCard";

export default function Orders_Details() {
  const { t } = useLanguage();
  const [ordersState, setOrdersState] = useState({
    PENDING: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  });
  const ordersStates = async () => {
    const response = await getRequest("/api/admin/orders/states");
    response.data.map((state) => {
      setOrdersState((prevState) => ({
        ...prevState,
        [state.state]: state.count,
      }));
    });
  };

  useEffect(() => {
    ordersStates();
  }, []);

  const cards = [
    {
      key: "PENDING",
      label: t("PENDING"),
      icon: <FaShoppingBag />,
      tone: "amber",
    },
    {
      key: "PROCESSING",
      label: t("PROCESSING"),
      icon: <FaBox />,
      tone: "blue",
    },
    {
      key: "SHIPPED",
      label: t("SHIPPED"),
      icon: <FaTruck />,
      tone: "purple",
    },
    {
      key: "DELIVERED",
      label: t("DELIVERED"),
      icon: <FaCheck />,
      tone: "green",
    },
    {
      key: "CANCELLED",
      label: t("CANCELLED"),
      icon: <FaTimes />,
      tone: "rose",
    },
  ];

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={ordersState[card.key] ?? 0}
          icon={card.icon}
          tone={card.tone}
        />
      ))}
    </div>
  );
}
