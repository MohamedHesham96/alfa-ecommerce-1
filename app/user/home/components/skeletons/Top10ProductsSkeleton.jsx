import SectionHeaderSkeleton from "./SectionHeaderSkeleton";
import ProductListRowSkeleton from "./ProductListRowSkeleton";

// Mirrors app//components/Top10Products.jsx
// (p-5 white card, header, 2 columns of 8 compact product rows)
export default function Top10ProductsSkeleton() {
  return (
    <div className="w-full h-auto bg-white rounded-3xl p-5">
      <SectionHeaderSkeleton titleClassName="h-5 w-32" />
      <div className="w-full xs:h-auto md:h-[430px] overflow-hidden grid gap-4 xs:grid-cols-1 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductListRowSkeleton key={`top10-row-${i}`} />
        ))}
      </div>
    </div>
  );
}
