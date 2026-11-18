import InfoTip from "./InfoTip";
import SectionEmpty from "./SectionEmpty";

const SOURCE_TONES = {
  GOOGLE: "admin-tone-blue",
  FACEBOOK: "admin-tone-blue",
  INSTAGRAM: "admin-tone-rose",
  YOUTUBE: "admin-tone-red",
  TIKTOK: "admin-tone-purple",
  DIRECT: "admin-tone-gray",
  REFERRAL: "admin-tone-purple",
  OTHER: "admin-tone-amber",
};

export default function TrafficSourcesCard({
  sources = [],
  t,
  formatNumber,
}) {
  const totalSessions = sources.reduce(
    (total, source) => total + (Number(source.sessions) || 0),
    0,
  );

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            {t("analytics_traffic_sources")}
            <InfoTip text={t("analytics_traffic_tooltip")} />
          </h2>
          <p className="admin-card-description">
            {t("analytics_traffic_sources_desc")}
          </p>
        </div>
      </div>
      <div className="admin-card-body">
        {totalSessions === 0 ? (
          <SectionEmpty title={t("analytics_empty_sources")} />
        ) : (
          <ul className="flex flex-col gap-4">
            {sources.map((source) => {
              const sessions = Number(source.sessions) || 0;
              const visitors = Number(source.visitors) || 0;
              const percentage = Number(source.sessionPercentage) || 0;
              const labelKey = `analytics_source_${String(source.source).toLowerCase()}`;
              return (
                <li key={source.source}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`analytics-source-badge ${SOURCE_TONES[source.source] || "admin-tone-gray"}`}
                      aria-hidden="true"
                    >
                      {t(labelKey).slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                          {t(labelKey)}
                        </p>
                        <p className="shrink-0 text-sm font-bold text-[var(--admin-ink)]">
                          {formatNumber(percentage)}%
                        </p>
                      </div>
                      <div className="analytics-progress mt-1.5">
                        <span
                          className="analytics-progress-fill analytics-progress-fill--accent"
                          style={{
                            width: `${Math.max(0, Math.min(100, percentage))}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {formatNumber(sessions)} {t("analytics_sessions_label")}
                        {" · "}
                        {formatNumber(visitors)} {t("analytics_visitors_label")}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
