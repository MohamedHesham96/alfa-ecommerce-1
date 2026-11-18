import {
  MdDevicesOther,
  MdHelpOutline,
  MdLaptopMac,
  MdPhoneIphone,
  MdTabletMac,
} from "react-icons/md";

import InfoTip from "./InfoTip";
import SectionEmpty from "./SectionEmpty";

const DEVICE_META = {
  MOBILE: { key: "analytics_device_mobile", icon: MdPhoneIphone, tone: "admin-tone-rose" },
  DESKTOP: { key: "analytics_device_desktop", icon: MdLaptopMac, tone: "admin-tone-blue" },
  TABLET: { key: "analytics_device_tablet", icon: MdTabletMac, tone: "admin-tone-purple" },
  UNKNOWN: { key: "analytics_device_unknown", icon: MdHelpOutline, tone: "admin-tone-gray" },
};

export default function DeviceBreakdownCard({
  devices = [],
  t,
  formatNumber,
}) {
  const totalSessions = devices.reduce(
    (total, device) => total + (Number(device.sessions) || 0),
    0,
  );

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title flex items-center gap-2">
            {t("analytics_devices")}
            <InfoTip text={t("analytics_device_tooltip")} />
          </h2>
          <p className="admin-card-description">{t("analytics_devices_desc")}</p>
        </div>
      </div>
      <div className="admin-card-body">
        {totalSessions === 0 ? (
          <SectionEmpty
            title={t("analytics_empty_devices")}
            icon={<MdDevicesOther />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {devices.map((device) => {
              const meta = DEVICE_META[device.device] || {
                key: "analytics_device_unknown",
                icon: MdHelpOutline,
                tone: "admin-tone-gray",
              };
              const Icon = meta.icon;
              const sessions = Number(device.sessions) || 0;
              const visitors = Number(device.visitors) || 0;
              const sessionPercentage = Number(device.sessionPercentage) || 0;
              const visitorPercentage = Number(device.visitorPercentage) || 0;
              return (
                <div key={device.device} className="analytics-device-tile">
                  <div className="flex items-center gap-2">
                    <span
                      className={`admin-stat-icon !h-9 !w-9 ${meta.tone}`}
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                    <p className="truncate text-sm font-semibold text-[var(--admin-ink)]">
                      {t(meta.key)}
                    </p>
                  </div>
                  <p className="mt-3 text-xl font-bold text-[var(--admin-ink)]">
                    {formatNumber(sessions)}
                    <span className="ms-1.5 text-xs font-semibold text-[var(--admin-muted)]">
                      {t("analytics_sessions_label")}
                    </span>
                  </p>
                  <div className="analytics-progress mt-2">
                    <span
                      className="analytics-progress-fill analytics-progress-fill--info"
                      style={{
                        width: `${Math.max(0, Math.min(100, sessionPercentage))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--admin-muted)]">
                    {t("analytics_percent_sessions").replace(
                      "{value}",
                      formatNumber(sessionPercentage),
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {formatNumber(visitors)} {t("analytics_visitors_label")}
                    {" · "}
                    {t("analytics_percent_visitors").replace(
                      "{value}",
                      formatNumber(visitorPercentage),
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
