import { IoMdInformationCircleOutline } from "react-icons/io";
import { useLanguage } from "../../../../context/LanguageContext";
import { useFeature } from "../../../../context/AppConfigContext";
import { RiRuler2Line } from "react-icons/ri";

function SpecRow({ label, value }) {
    if (!value) return null;

    return (
        <div className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 text-sm text-gray-600 sm:w-1/2 sm:text-base">{label}</span>
            <span className="min-w-0 flex-1 break-words text-sm font-medium text-gray-900 sm:text-base">
                {value}
            </span>
        </div>
    );
}

export default function Specification({ product }) {
    const { t } = useLanguage();
    const itemDimensionsEnabled = useFeature("ITEM_DIMENSIONS_ENABLED");
    const hasDimensions =
        itemDimensionsEnabled &&
        (product.length || product.width || product.height);
    const hasGeneral =
        product.content || product.flash || product.ram || product.releaseYear || hasDimensions;

    return (
        <div className="w-full min-w-0">
            <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
                {t("specification")}
            </h2>
            <div className="w-full rounded-3xl bg-[#f6f5f8] p-5 sm:p-8">
                <div className="flex flex-col gap-5 sm:gap-6">
                    <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-900 sm:text-xl">
                        <IoMdInformationCircleOutline className="h-6 w-6 shrink-0 text-[#E14A5C]" aria-hidden />
                        {t("Overview")}
                    </h3>
                    <div className="flex w-full flex-col gap-4">
                        <SpecRow label="Brand" value={product.brand} />
                        <SpecRow label="model" value={product.code} />
                    </div>
                    <hr className="h-px w-full border-0 bg-gray-200" />
                    {hasGeneral ? (
                        <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-900 sm:text-xl">
                            <RiRuler2Line className="h-6 w-6 shrink-0 text-[#E14A5C]" aria-hidden />
                            {t("General")}
                        </h3>
                    ) : null}
                    <div className="flex w-full flex-col gap-4">
                        <SpecRow label="content" value={product.content} />
                        <SpecRow label="flash" value={product.flash} />
                        <SpecRow label="ram" value={product.ram} />
                        {itemDimensionsEnabled ? (
                            <>
                                <SpecRow label={t("length")} value={product.length} />
                                <SpecRow label={t("width")} value={product.width} />
                                <SpecRow label={t("height")} value={product.height} />
                            </>
                        ) : null}
                        <SpecRow label="Release years" value={product.releaseYear} />
                    </div>
                </div>
            </div>
        </div>
    );
}
