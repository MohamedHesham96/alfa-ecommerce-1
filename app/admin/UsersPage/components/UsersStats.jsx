"use client";

import {
  PiProhibitFill,
  PiShoppingCartFill,
  PiUserCheckFill,
  PiUserMinusFill,
  PiUsersThreeFill,
} from "react-icons/pi";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useAdminStats } from "../../hooks/useAdminStats";
import StatCard from "../../components/ui/StatCard";

export default function UsersStats({ refreshKey = 0 }) {
  const { t } = useLanguage();
  const stats = useAdminStats("/api/admin/users/stats", refreshKey);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label={t("users_stats_total")}
        value={stats?.totalUsers ?? 0}
        icon={<PiUsersThreeFill />}
        tone="blue"
      />
      <StatCard
        label={t("users_stats_active")}
        value={stats?.activeUsers ?? 0}
        icon={<PiUserCheckFill />}
        tone="green"
      />
      <StatCard
        label={t("users_stats_inactive")}
        value={stats?.inactiveUsers ?? 0}
        icon={<PiUserMinusFill />}
        tone="gray"
      />
      <StatCard
        label={t("users_stats_blocked")}
        value={stats?.blockedUsers ?? 0}
        icon={<PiProhibitFill />}
        tone="red"
      />
      <StatCard
        label={t("users_stats_with_orders")}
        value={stats?.usersWithOrders ?? 0}
        icon={<PiShoppingCartFill />}
        tone="purple"
      />
    </div>
  );
}
