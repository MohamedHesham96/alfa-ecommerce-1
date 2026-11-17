"use client";
import { FaPlusSquare } from "react-icons/fa";
import { useLanguage } from "../../../../context/LanguageContext.js";
import { TbCategoryPlus } from "react-icons/tb";
import { MdLocalShipping } from "react-icons/md";
import { useRouter } from "next/navigation.js";
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
  },
  {
    key: "add_admin",
    icon: <FaPlusSquare />,
    tone: "green",
    href: "/admin/Admins",
    page: "Admins Management",
  },
];

export default function QuickActions() {
  const { t } = useLanguage();
  const navigate = useRouter();
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
            }}
            className="group flex items-center gap-3 rounded-xl border border-[#e4e8f0] bg-white p-3 text-start transition-all hover:-translate-y-0.5 hover:border-[#d3d9e5] hover:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)]"
          >
            <span
              className={`admin-stat-icon admin-tone-${action.tone} transition-transform group-hover:scale-105`}
              aria-hidden="true"
            >
              {action.icon}
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-[#344054]">
              {t(action.key)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
