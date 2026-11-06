import Skeleton from "./Skeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

// Mirrors app//components/ProductAdsSlider.jsx
// (40% product card column + 60% image column + pagination dots)
export default function ProductAdsSliderSkeleton() {
  return (
    <div className="w-full h-full flex justify-between rounded-3xl relative">
      <div className="w-[40%] h-full flex items-center justify-center">
        <div className="w-full max-w-[300px]">
          <ProductCardSkeleton />
        </div>
      </div>

      <div className="w-[60%] h-full">
        <div className="w-full h-[500px]">
          <Skeleton className="relative w-full h-full rounded-[22px]" />
        </div>
      </div>

      <div className="absolute z-10 flex items-center gap-2 bottom-5 left-[20%]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={`dot-${i}`}
            className={`rounded-full ${i === 0 ? "w-2.5 h-2.5" : "w-2 h-2"}`}
          />
        ))}
      </div>
    </div>
  );
}
