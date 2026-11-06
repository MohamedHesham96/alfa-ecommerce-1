import Image from "next/image";
import { useLanguage } from "../../../../context/LanguageContext";
import { getThumbnailUrl } from "../../../../utils/functions";
import StarRating from "../../components/StarRating";
import Link from "next/link";
import { productPath } from "../../../../lib/seo";

export default function Top10Products({ Products, section, href }) {
    const { t , locale } = useLanguage()
    return (
        <div className="w-full h-auto bg-white rounded-3xl p-5 ">
            <div className="w-full h-full flex justify-between items-center">
                <h2 className="font-semibold text-lg sticky z-10 ">{t(section)}</h2>
                <div className="text-xs font-semibold">
                    <Link href={href || "/user/products/section/newProducts"}>{t("shopMore")} </Link>
                    <hr className="bg-red-500 h-[2px] border-none w-auto " />
                </div>
            </div>
            <div className="w-full xs:h-auto md:h-[430px]  xs:grid-cols-1 sm:grid-cols-2 grid gap-1">

                {Products?.map((product, index) => {
                    return (

                        <Link
                        href={productPath(product)}
                        key={index} className={`${index < 8 ? "flex" :"hidden"} gap-2 items-center cursor-pointer w-full`}>
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
                            <div>

                                <span className="text-sm font-semibold">{locale === "ar" ? product.nameAr : product.nameEn}</span>
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
