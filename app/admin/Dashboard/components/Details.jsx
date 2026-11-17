"use client";
import { FaHourglassStart } from "react-icons/fa";
import { IoMdCart } from "react-icons/io";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { IoFileTray } from "react-icons/io5";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { useEffect, useState } from "react";
import { getRequest } from "../../../../utils/requestsUtils.js";
import { useRouter } from "next/navigation.js";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";
import { useIdContext } from "../../../../context/idContext.jsx";
import StatCard from "../../components/ui/StatCard";

export default function Dashboard_Details() {
  const { t } = useLanguage();
  const [activeItems, setActiveItems] = useState(0);
  const [newUsers, setNewUsers] = useState();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const navigate = useRouter();
  const { setSelectedState } = useIdContext();

  const { setSelectedNamePage } = useNamePageInAdminContext();
  const dashboardPendingOrders = async () => {
    const response = await getRequest("/api/admin/dashboard");
    const resData = response.data;

    setPendingOrders(resData.pendingOrders.length);

    setNewUsers(resData.newUsers);
    setActiveItems(resData.activeItems);

    setOrdersCount(resData.ordersCount);
  };

  useEffect(() => {
    dashboardPendingOrders();
  }, []);

  return (
    <div className="grid w-full grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
      <StatCard
        label={t("total_orders")}
        value={ordersCount}
        icon={<IoMdCart />}
        tone="rose"
        onClick={() => {
          navigate.push("/admin/orders");
          setSelectedNamePage("Orders Management");
          setSelectedState("PENDING");
        }}
      />

      <StatCard
        label={t("pending_orders")}
        value={pendingOrders}
        icon={<FaHourglassStart />}
        tone="amber"
        onClick={() => {
          navigate.push("/admin/orders");
          setSelectedNamePage("Orders Management");
        }}
      />

      <StatCard
        label={t("active_products")}
        value={activeItems}
        icon={<IoFileTray />}
        tone="purple"
      />

      <StatCard
        label={t("new_users")}
        value={newUsers ?? 0}
        valuePrefix="+"
        icon={<AiOutlineUsergroupAdd />}
        tone="blue"
      />
    </div>
  );
}
