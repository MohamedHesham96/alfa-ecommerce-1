import Image from "next/image";
import { useLanguage } from "../../../../context/LanguageContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import StarRating from "../../components/StarRating";
import Link from "next/link";
import { productPath } from "../../../../lib/seo";

const MAX_VISIBLE_PRODUCTS = 8;

export default function Top10Products({ Products, section, href }) {
    const { t , locale } = useLanguage()
    // The card matches the ad slider height. Two columns of up to eight
    // products fill the four rows; an odd last row simply has one product.
    const products = (Products || []).slice(0, MAX_VISIBLE_PRODUCTS);
    return (
        <div className="w-full h-auto bg-white rounded-3xl p-5 ">
            <div className="w-full h-full flex justify-between items-center">
                <h2 className="font-semibold text-lg sticky z-10 ">{t(section)}</h2>
                <div className="text-xs font-semibold">
                    <Link prefetch={false} href={href || "/user/products/section/newProducts"}>{t("shopMore")} </Link>
                    <hr className="bg-red-500 h-[2px] border-none w-auto " />
                </div>
            </div>
            <div className="w-full xs:h-auto md:h-[430px] grid gap-4 xs:grid-cols-1 sm:grid-cols-2">

                {products.map((product, index) => {
                    return (

                        <Link prefetch={false}
                        href={productPath(product)}
                        key={index} className="flex gap-2 items-center cursor-pointer w-full">
                            <div className="relative w-[60px] h-[60px] ">
                                <Image src={
                                    process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL +
                                    getThumbnailUrl(product.images?.[0]?.imageUrl)
                                } alt={locale === "ar" ? product.nameAr : product.nameEn}
                                    fill
                                    quality={85}
                                    sizes="60px"
                                    className="object-fill rounded-full" />
                            </div>
                            <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                    <span className="text-sm font-semibold">{locale === "ar" ? product.nameAr : product.nameEn}</span>
                                    {product.available === false ? (
                                        <span className="whitespace-nowrap rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-gray-600">
                                            {t("soldOut")}
                                        </span>
                                    ) : null}
                                </div>
                                <div className={product.averageRating ? "block" : "hidden"}>
                                    <StarRating rating={product.averageRating} /></div>

                                <div className="flex  justify-start gap-2 items-center ">
                                    {product.oldPrice ? (
                                        <div className="flex gap-2">
                                            <span className=" line-through text-xs  flex text-gray-500">
                                                {product.oldPrice?.toLocaleString("en-US")}{" "}{t("currency")}
                                            </span>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                <span className="text-sm font-semibold text-red-600 ">
                                    {product.price?.toLocaleString("en-US")}.00 {t("currency")}
                                </span>

                                </div>
                            </div>
                        </Link>
                    );
                })
                }

            </div></div>

    )
}
