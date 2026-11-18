import { MdFavoriteBorder, MdPlaylistAddCheck } from "react-icons/md";

import InfoTip from "./InfoTip";
import SectionEmpty from "./SectionEmpty";

export default function WishlistCard({ wishlist, t, formatNumber }) {
  const visitors = Number(wishlist?.uniqueVisitors) || 0;
  const additions = Number(wishlist?.additions) || 0;

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            {t("analytics_wishlist_activity")}
            <InfoTip text={t("analytics_wishlist_tooltip")} />
          </h2>
          <p className="admin-card-description">
            {t("analytics_wishlist_desc")}
          </p>
        </div>
      </div>
      <div className="admin-card-body">
        {additions === 0 && visitors === 0 ? (
          <SectionEmpty
            title={t("analytics_empty_wishlist")}
            icon={<MdFavoriteBorder />}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="analytics-wishlist-stat">
              <span className="admin-stat-icon admin-tone-rose" aria-hidden="true">
                <MdFavoriteBorder />
              </span>
              <div className="min-w-0">
                <p className="admin-stat-label">
                  {t("analytics_wishlist_visitors")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--admin-ink)]">
                  {formatNumber(visitors)}
                </p>
              </div>
            </div>
            <div className="analytics-wishlist-stat">
              <span className="admin-stat-icon admin-tone-green" aria-hidden="true">
                <MdPlaylistAddCheck />
              </span>
              <div className="min-w-0">
                <p className="admin-stat-label">
                  {t("analytics_wishlist_additions")}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--admin-ink)]">
                  {formatNumber(additions)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
