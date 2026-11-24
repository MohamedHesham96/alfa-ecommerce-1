"use client";
import { FaPlusSquare } from "react-icons/fa";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { TbCategoryPlus, TbTruckReturn } from "react-icons/tb";
import { MdInsights, MdLocalShipping } from "react-icons/md";
import { ImUsers } from "react-icons/im";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { useRouter } from "next/navigation.js";
import { useIdContext } from "../../../../context/idContext.jsx";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin.jsx";

const ACTIONS = [
  {
    key: "add_product",
    icon: <FaPlusSquare />,
    tone: "blue",
    href: "/admin/Products",
    page: "Products Management",
  },
  {
    key: "add_category",
    icon: <TbCategoryPlus />,
    tone: "purple",
    href: "/admin/Categories",
    page: "Categories Management",
  },
  {
    key: "process_orders",
    icon: <MdLocalShipping />,
    tone: "amber",
    href: "/admin/orders",
    page: "Orders Management",
    state: "PENDING",
  },
  {
    key: "add_admin",
    icon: <FaPlusSquare />,
    tone: "green",
    href: "/admin/Admins",
    page: "Admins Management",
  },
  {
    key: "returns_management",
    icon: <TbTruckReturn />,
    tone: "amber",
    href: "/admin/Returns",
    page: "Returns Management",
  },
  {
    key: "shippingcost",
    icon: <RiMoneyDollarCircleLine />,
    tone: "purple",
    href: "/admin/ShippingCost",
    page: "ShippingCost Management",
  },
  {
    key: "users",
    icon: <ImUsers />,
    tone: "green",
    href: "/admin/UsersPage/Users",
    page: "Users Management",
  },
  {
    key: "website_analytics",
    icon: <MdInsights />,
    tone: "blue",
    href: "/admin/Analytics",
    page: "Website Analytics",
  },
];

export default function QuickActions() {
  const { t } = useLanguage();
  const navigate = useRouter();
  const { setSelectedState } = useIdContext();
  const { setSelectedNamePage } = useNamePageInAdminContext();

  return (
    <section className="admin-card mt-5 w-full">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">{t("quick-actions")}</h2>
          <p className="admin-card-description">
            {t("quick_actions_description")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-4">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => {
              navigate.push(action.href);
              setSelectedNamePage(action.page);
              setSelectedState(action.state ?? null);
            }}
            className="group flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 text-start transition-all hover:-translate-y-0.5 hover:border-[var(--admin-border-strong)] hover:shadow-[var(--admin-shadow)]"
          >
            <span
              className={`admin-stat-icon admin-tone-${action.tone} transition-transform group-hover:scale-105`}
              aria-hidden="true"
            >
              {action.icon}
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--admin-ink-soft)]">
              {t(action.key)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
