"use client";
import { BsStars } from "react-icons/bs";
import Image from "next/image";
import { FaCirclePlus } from "react-icons/fa6";
import Link from "next/link";
import { useEffect, useState } from "react";
import {  postRequest } from "../../../../utils/requestsUtils";
import ProductForm from "../../Products/components/ProductForm";
import { useIdContext } from "../../../../context/idContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { AiFillStar } from "react-icons/ai";
import { getThumbnailUrl } from "../../../../utils/functions";
import { useNamePageInAdminContext } from "../../../../context/namePageInAdmin";

export default function FeaturedProducts() {
  const [featuersProducts, setFeatuersProduct] = useState([]);
  const { setSelectedProductId } = useIdContext();
    const { locale } = useLanguage();

  const { t } = useLanguage();
  const {setSelectedNamePage} = useNamePageInAdminContext()
const [isFormOpen,setIsFormOpen] = useState(false)
  const getFeatuersProducts = async () => {
    const response = await postRequest(
      "/api/public/items/search",
      {
        page: 0,
        size: 100,
        isFavorite: true,
      },
      ""
    );
    setFeatuersProduct(response.data);
  };
  useEffect(() => {
    getFeatuersProducts();
  }, []);
  return (
    <div className="w-full h-auto relative   ">
      <ProductForm  isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen}/>

      <div className=" flex justify-between items-center">
        <div className="flex  items-center gap-3">
          <span className=" text-[var(--admin-danger)] rounded-full text-xl  p-1">
            <AiFillStar className="" />
          </span>
          <h1 className="font-semibold md:text-xl xs:text-lg">
            {t("featured_products")}{" "}
          </h1>
        </div>
        <Link
          href="/admin/Products"
          className="md:text-4xl xs:text-3xl mx-10 text-[var(--admin-danger)] hover:text-[var(--admin-danger-text)]"
           onClick={() => setSelectedNamePage("Products Management")}
        >
          <FaCirclePlus />
        </Link>
      </div>
      <div className="my-5 grid lg:grid-cols-5 md:grid-cols-3 xs:grid-cols-2 gap-5 w-full">
        {featuersProducts.map((product, index) => {
          const describtion =
            locale === "ar"
              ? product.descriptionAr
              : product.descriptionEn;
          return (
            <div
              key={index}
              onClick={() => {
                setIsFormOpen(true)
                setSelectedProductId(product.itemId);
              }}
              className="cursor-pointer hover:shadow-md "
            >
              <div className="min-h-[290px] h-auto bg-[var(--admin-surface)] border rounded-md">
                <div className="">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}${
                      getThumbnailUrl(product.mainImageURL) || ""
                    }`}
                    alt=""
                    width={500}
                    height={500}
                    priority
                    className="h-[150px]  w-full rounded-t-lg"
                  />
                  <div className="px-3">
                    <div className="flex justify-between items-center">
                      <h1 className="my-3 text-sm font-semibold">
                        {locale === "ar"
                          ? product.nameAr
                          : product.nameEn}
                      </h1>
                     
                    </div>
                    {/* <h1 className="md:text-sm xs:text-xs mt-2 text-[var(--admin-muted-soft)] ">
                      {describtion.length <= 50
                        ? describtion
                        : describtion.slice(0, 50) + " ..."}
                    </h1> */}
                  </div>
                </div>

                  <div className="flex w-full justify-between items-center mt-3  px-3">
                          {product.available ? (
                            <div
                              className="flex flex-col "
                             
                            >
                              <div className=" my-2 h-4">
                                {product.oldPrice ? (
                                  <span className=" font-semibold  w-full text-center bg-[var(--admin-danger-solid)] text-xs p-[4px]  text-white rounded-md">
                                    {t("off")}
                                    {" " +
                                      (
                                        ((product.oldPrice - product.price) /
                                          product.oldPrice) *
                                        100
                                      ).toFixed(0)}
                                    %
                                  </span>
                                ) : (
                                  ""
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className=" font-bold ">
                                  {product.price.toLocaleString("en-US")} {t("currency")}
                                </span>
                                {product.oldPrice ? (
                                  <div className="flex gap-2">
                                    <span className=" font-semibold line-through text-sm  mt-2 flex text-[var(--admin-muted-soft)]">
                                      {product.oldPrice.toLocaleString("en-US")}{" "}
                                      {t("currency")}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="p-[11px]"></span>
                                )}
                              </div>
                            </div>
                          ) : (
                            ""
                          )}
                          {product.available ? (
                            ""
                          ) : (
                            <span className="text-[var(--admin-danger)] mt-8">
                              {t("Currently_unavailable")}
                            </span>
                          )}
                         
                        </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
