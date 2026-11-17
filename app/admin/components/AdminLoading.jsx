export default function AdminLoading({ rows = 6, showHeader = true }) {
  return (
    <div className="admin-loading-page" aria-busy="true" aria-live="polite">
      {showHeader ? (
        <div className="flex flex-col gap-3">
          <div className="admin-skeleton h-8 w-56" />
          <div className="admin-skeleton h-4 w-full max-w-xl" />
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`stat-${index}`} className="admin-card admin-card-pad">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="admin-skeleton h-3.5 w-24" />
                <div className="admin-skeleton h-7 w-16" />
              </div>
              <div className="admin-skeleton h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="admin-card overflow-hidden">
        <div className="admin-card-header">
          <div className="admin-skeleton h-5 w-40" />
          <div className="admin-skeleton h-9 w-52" />
        </div>
        <div className="divide-y divide-[#eef1f6]">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={`row-${index}`} className="flex items-center gap-4 px-5 py-4">
              <div className="admin-skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="admin-skeleton h-3.5 w-2/5" />
                <div className="admin-skeleton h-3 w-1/4" />
              </div>
              <div className="admin-skeleton h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
