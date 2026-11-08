import Skeleton from "./Skeleton";
import StarsSkeleton from "./StarsSkeleton";
import SectionHeaderSkeleton from "./SectionHeaderSkeleton";

// Mirrors app//components/BestPick.jsx
// (rounded-2xl white card, header, 4 slides of 50px circle + name + stars + price)
export default function BestPickSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl p-4">
      <SectionHeaderSkeleton titleClassName="h-5 w-48" />
      <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`best-pick-${i}`} className="flex items-center gap-1 w-full px-5">
            <Skeleton className="w-[50px] h-[50px] rounded-full shrink-0" />
            <div className="flex flex-col gap-2 w-full min-w-0">
              <Skeleton className="h-3 w-4/5" />
              <StarsSkeleton size="h-[13px] w-[13px]" />
              <div className="flex w-full justify-start gap-2 items-center">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3.5 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
