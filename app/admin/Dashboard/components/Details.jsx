"use client";
import { FaHourglassStart } from "react-icons/fa";
import { IoMdCart } from "react-icons/io";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { IoFileTray } from "react-icons/io5";
import {
  PiChartLineUpFill,
  PiShoppingCartFill,
  PiTruckFill,
} from "react-icons/pi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { useRouter } from "next/navigation.js";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";
import { useIdContext } from "../../../../context/idContext.jsx";
import StatCard from "../../components/ui/StatCard";
import { useDashboardSummary } from "../context/DashboardSummaryContext";

export default function Dashboard_Details() {
  const { t } = useLanguage();
  const { summary } = useDashboardSummary();
  const navigate = useRouter();
  const { setSelectedState } = useIdContext();
  const { setSelectedNamePage } = useNamePageInAdminContext();

  const ordersCount = summary?.ordersCount ?? 0;
  const pendingOrders =
    summary?.ordersStats?.find((row) => row.state === "PENDING")?.count ?? 0;
  const activeItems = summary?.activeItems ?? 0;
  const totalProducts =
    Number(summary?.itemStats?.active ?? 0) +
    Number(summary?.itemStats?.inactive ?? 0);
  const unavailableProducts = Number(summary?.itemStats?.unavailable ?? 0);
  const newUsers = summary?.newUsers ?? 0;

  const processingOrders =
    summary?.ordersStats?.find((row) => row.state === "PROCESSING")?.count ?? 0;
  const cancelledOrders =
    summary?.ordersStats?.find((row) => row.state === "CANCELLED")?.count ?? 0;
  const deliveredOrders =
    summary?.ordersStats?.find((row) => row.state === "DELIVERED")?.count ?? 0;
  const nonCancelledOrders = Math.max(
    0,
    Number(ordersCount) - Number(cancelledOrders),
  );
  const cancellationRate =
    ordersCount > 0 ? (Number(cancelledOrders) / Number(ordersCount)) * 100 : 0;
  const totalOrderValue = Number(summary?.totalOrderValue ?? 0);
  const averageOrderValue =
    nonCancelledOrders > 0 ? totalOrderValue / nonCancelledOrders : 0;
  const deliveryRate =
    nonCancelledOrders > 0
      ? (Number(deliveredOrders) / nonCancelledOrders) * 100
      : 0;
  const totalCustomers = summary?.userStats?.totalUsers ?? 0;
  const customersWithOrders = summary?.userStats?.usersWithOrders ?? 0;
  const customersOrdersPercentage = Number(
    summary?.userStats?.ordersPercentage ?? 0,
  );

  const formatMoney = (value) =>
    `${Number(value || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} ${t("currency")}`;

  const openOrders = (state = null) => {
    setSelectedState(state);
    navigate.push("/admin/orders");
    setSelectedNamePage("Orders Management");
  };

  return (
    <div className="grid gap-3 xl:gap-4">
      <div className="grid w-full grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard
          label={t("total_orders")}
          value={ordersCount}
          hint={`${t("CANCELLED")}: ${cancelledOrders} · ${cancellationRate.toFixed(1)}%`}
          icon={<IoMdCart />}
          tone="rose"
          onClick={() => openOrders()}
        />

        <StatCard
          label={t("pending_orders")}
          value={pendingOrders}
          hint={`${t("PROCESSING")}: ${processingOrders}`}
          icon={<FaHourglassStart />}
          tone="amber"
          onClick={() => openOrders("PENDING")}
        />

        <StatCard
          label={t("active_products")}
          value={activeItems}
          hint={t("dashboard_products_hint")
            .replace("{total}", totalProducts)
            .replace("{unavailable}", unavailableProducts)}
          icon={<IoFileTray />}
          tone="purple"
        />

        <StatCard
          label={t("new_users")}
          value={newUsers}
          valuePrefix="+"
          hint={`${t("users_stats_total")}: ${totalCustomers}`}
          icon={<AiOutlineUsergroupAdd />}
          tone="blue"
        />
      </div>

      <div className="grid w-full grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard
          label={t("dashboard_orders_value")}
          value={formatMoney(totalOrderValue)}
          hint={t("dashboard_orders_value_hint")}
          icon={<RiMoneyDollarCircleLine />}
          tone="green"
          onClick={() => openOrders()}
        />

        <StatCard
          label={t("dashboard_average_order_value")}
          value={formatMoney(averageOrderValue)}
          hint={t("dashboard_average_order_value_hint")}
          icon={<PiChartLineUpFill />}
          tone="purple"
          onClick={() => openOrders()}
        />

        <StatCard
          label={t("users_stats_with_orders")}
          value={customersWithOrders}
          hint={`${customersOrdersPercentage.toFixed(1)}% ${t(
            "users_stats_percentage_of_total",
          )}`}
          icon={<PiShoppingCartFill />}
          tone="rose"
          onClick={() => {
            navigate.push("/admin/UsersPage/Users");
            setSelectedNamePage("Users Management");
          }}
        />

        <StatCard
          label={t("dashboard_delivery_rate")}
          value={`${deliveryRate.toFixed(1)}%`}
          hint={`${deliveredOrders} ${t("delivered_orders")}`}
          icon={<PiTruckFill />}
          tone="blue"
          onClick={() => openOrders("DELIVERED")}
        />
      </div>
    </div>
  );
}
