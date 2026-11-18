import InfoTip from "./InfoTip";

export default function SessionQualityCard({
  sessions,
  t,
  formatNumber,
  formatDuration,
}) {
  const eligible = Number(sessions?.eligibleSessions) || 0;
  const bounced = Number(sessions?.bouncedSessions) || 0;
  const bounceRate = Number(sessions?.bounceRate) || 0;
  const average = Number(sessions?.averageDurationSeconds) || 0;

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            {t("analytics_session_quality")}
            <InfoTip text={t("analytics_session_quality_desc")} />
          </h2>
          <p className="admin-card-description">
            {t("analytics_session_quality_desc")}
          </p>
        </div>
      </div>
      <div className="admin-card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="analytics-metric-tile">
            <div className="flex items-center gap-1.5">
              <p className="admin-stat-label">{t("analytics_avg_duration")}</p>
              <InfoTip text={t("analytics_duration_tooltip")} />
            </div>
            <p className="admin-stat-value mt-2">
              {formatDuration(average)}
            </p>
            <p className="admin-stat-hint">
              {t("analytics_eligible_sessions").replace(
                "{count}",
                formatNumber(eligible),
              )}
            </p>
          </div>

          <div className="analytics-metric-tile">
            <div className="flex items-center gap-1.5">
              <p className="admin-stat-label">{t("analytics_bounce_rate")}</p>
              <InfoTip text={t("analytics_bounce_tooltip")} />
            </div>
            <p className="admin-stat-value mt-2">
              {formatNumber(bounceRate)}%
            </p>
            <div
              className="analytics-progress mt-3"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(bounceRate)}
              aria-label={t("analytics_bounce_rate")}
            >
              <span
                className="analytics-progress-fill analytics-progress-fill--accent"
                style={{ width: `${Math.min(100, Math.max(0, bounceRate))}%` }}
              />
            </div>
            <p className="admin-stat-hint">
              {t("analytics_bounced_sessions").replace(
                "{count}",
                formatNumber(bounced),
              )}
            </p>
          </div>
        </div>

        {eligible === 0 ? (
          <p className="admin-hint mt-4">{t("analytics_no_ended_sessions")}</p>
        ) : null}
      </div>
    </section>
  );
}
