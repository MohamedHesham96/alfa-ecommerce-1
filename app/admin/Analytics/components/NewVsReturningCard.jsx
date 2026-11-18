import InfoTip from "./InfoTip";
import SectionEmpty from "./SectionEmpty";

export default function NewVsReturningCard({
  distribution,
  t,
  formatNumber,
}) {
  const newVisitors = Number(distribution?.newVisitors) || 0;
  const returningVisitors = Number(distribution?.returningVisitors) || 0;
  const total = newVisitors + returningVisitors;
  const newPercentage = Number(distribution?.newPercentage) || 0;
  const returningPercentage = Number(distribution?.returningPercentage) || 0;

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            {t("analytics_new_vs_returning")}
            <InfoTip text={t("analytics_new_tooltip")} />
          </h2>
          <p className="admin-card-description">
            {t("analytics_new_vs_returning_desc")}
          </p>
        </div>
      </div>
      <div className="admin-card-body">
        {total === 0 ? (
          <SectionEmpty title={t("analytics_empty_returning")} />
        ) : (
          <>
            <div
              className="analytics-split"
              role="img"
              aria-label={`${t("analytics_new_visitors")}: ${formatNumber(newVisitors)} (${formatNumber(newPercentage)}%), ${t("analytics_returning_visitors")}: ${formatNumber(returningVisitors)} (${formatNumber(returningPercentage)}%)`}
            >
              <span
                className="analytics-split-segment analytics-split-segment--new"
                style={{ width: `${Math.max(0, Math.min(100, newPercentage))}%` }}
              />
              <span
                className="analytics-split-segment analytics-split-segment--returning"
                style={{
                  width: `${Math.max(0, Math.min(100, returningPercentage))}%`,
                }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="analytics-legend-row">
                <span className="analytics-dot analytics-dot--accent" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="admin-stat-label">{t("analytics_new_visitors")}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xl font-bold text-[var(--admin-ink)]">
                    <span>{formatNumber(newVisitors)}</span>
                    <span
                      dir="ltr"
                      className="text-sm font-semibold text-[var(--admin-muted)]"
                    >
                      ({formatNumber(newPercentage)}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="analytics-legend-row">
                <span className="analytics-dot analytics-dot--info" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="admin-stat-label">
                    {t("analytics_returning_visitors")}
                  </p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xl font-bold text-[var(--admin-ink)]">
                    <span>{formatNumber(returningVisitors)}</span>
                    <span
                      dir="ltr"
                      className="text-sm font-semibold text-[var(--admin-muted)]"
                    >
                      ({formatNumber(returningPercentage)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
