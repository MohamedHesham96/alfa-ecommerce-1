import Skeleton from "./Skeleton";

// Mirrors app/user/home/components/CategoriesSection.jsx
// (white rounded card, title + shop more, 3 column grid of circular icons with a centered label)
export default function CategorySkeleton({
  count = 6,
  showHeader = true,
  className = "",
}) {
  return (
    <div
      className={`flex h-full w-full min-w-0 flex-col rounded-2xl bg-white p-4 md:h-[350px] ${className}`}
    >
      {showHeader && (
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
            <Skeleton className="h-5 w-28" />
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <Skeleton className="h-3 w-16" />
            <hr className="h-[2px] w-16 border-none bg-gray-200" />
          </div>
        </div>
      )}

      <div className="mt-3 grid flex-1 grid-cols-3 content-center gap-2 sm:gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={`category-${i}`}
            className="flex min-w-0 flex-col items-center justify-start gap-2 px-1 py-1"
          >
            <Skeleton className="h-14 w-14 shrink-0 rounded-full sm:h-16 sm:w-16 md:h-12 md:w-12 lg:h-[72px] lg:w-[72px]" />
            <div className="flex w-full flex-col items-center gap-1">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
