"use client";
import ProductCard from "../../components/ProductCard";

export default function FeatuerProducts({ Products, type }) {
  return (
    <div className="flex justify-center items-center relative">
      <div className="w-full">
        {type === "MoreRecommended" ? (
          <div className="grid xl:grid-cols-6 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Products.map((product, index) => {
              return (
                <div key={index} className="cursor-pointer">
                  <ProductCard productInfo={product} favorite={false} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`grid xl:grid-cols-5 sm:grid-cols-3 xs:grid-cols-2 gap-5`}>
            {Products?.map((product, index) => {
              return (
                <div key={index} className="rounded-lg flex justify-center cursor-pointer">
                  <ProductCard productInfo={product} favorite={false} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
