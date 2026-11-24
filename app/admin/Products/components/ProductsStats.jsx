"use client";

import {
  PiCheckCircleFill,
  PiMinusCircleFill,
  PiPackageFill,
  PiStarFill,
  PiXCircleFill,
} from "react-icons/pi";

import { useLanguage } from "../../../../context/LanguageContext.js";
import { useAdminStats } from "../../hooks/useAdminStats";
import StatCard from "../../components/ui/StatCard";

export default function ProductsStats({ refreshKey = 0 }) {
  const { t } = useLanguage();
  const stats = useAdminStats("/api/admin/items/stats", refreshKey);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label={t("products_stats_active")}
        value={stats?.active ?? 0}
        icon={<PiCheckCircleFill />}
        tone="green"
      />
      <StatCard
        label={t("products_stats_inactive")}
        value={stats?.inactive ?? 0}
        icon={<PiMinusCircleFill />}
        tone="gray"
      />
      <StatCard
        label={t("products_stats_available")}
        value={stats?.available ?? 0}
        icon={<PiPackageFill />}
        tone="blue"
      />
      <StatCard
        label={t("products_stats_unavailable")}
        value={stats?.unavailable ?? 0}
        icon={<PiXCircleFill />}
        tone="red"
      />
      <StatCard
        label={t("products_stats_favorite")}
        value={stats?.favorite ?? 0}
        icon={<PiStarFill />}
        tone="amber"
      />
    </div>
  );
}
