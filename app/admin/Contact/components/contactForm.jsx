"use client";
import { useEffect, useState } from "react";
import {
  MdContactPage,
  MdEmail,
  MdSave,
  MdSupportAgent,
} from "react-icons/md";
import { FaSquarePhone, FaSquareWhatsapp, FaXTwitter } from "react-icons/fa6";
import {
  FaFacebookSquare,
  FaInstagramSquare,
  FaTelegram,
  FaTimes,
  FaYoutube,
} from "react-icons/fa";
import { IoMdShare } from "react-icons/io";

import { getRequest, putRequest } from "../../../../utils/requestsUtils";
import { useLanguage } from "../../../../context/LanguageContext";
import FormField from "../../components/ui/FormField";

const CONTACT_FIELDS = [
  {
    key: "email",
    labelKey: "official-email-address",
    icon: <MdEmail />,
    tone: "rose",
    type: "email",
    placeholder: "hello@example.com",
    dir: "ltr",
  },
  {
    key: "phone",
    labelKey: "support-phone-number",
    icon: <FaSquarePhone />,
    tone: "blue",
    type: "tel",
    placeholder: "+20 100 000 0000",
    dir: "ltr",
  },
];

const SOCIAL_FIELDS = [
  {
    key: "facebock",
    label: "Facebook",
    icon: <FaFacebookSquare />,
    tone: "blue",
    placeholder: "https://facebook.com/...",
  },
  {
    key: "whatsApp",
    label: "WhatsApp",
    icon: <FaSquareWhatsapp />,
    tone: "green",
    placeholder: "https://wa.me/...",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: <FaTelegram />,
    tone: "blue",
    placeholder: "https://t.me/...",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <FaInstagramSquare />,
    tone: "rose",
    placeholder: "https://instagram.com/...",
  },
  {
    key: "x",
    label: "X",
    icon: <FaXTwitter />,
    tone: "gray",
    placeholder: "https://x.com/...",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: <FaYoutube />,
    tone: "rose",
    placeholder: "https://youtube.com/...",
  },
];

export default function ContactForm() {
  const [loading, setLoading] = useState();
  const [contactInfo, setContactInfo] = useState({
    phone: "",
    email: "",
    facebock: "",
    whatsApp: "",
    instagram: "",
    x: "",
    telegram: "",
    youtube: "",
  });
  const { t, locale } = useLanguage();
  const isArabic = locale === "ar";

  const addContactInfo = async () => {
    try {
      setLoading(true);

      await putRequest(
        "/api/admin/contact",
        {
          phone: contactInfo.phone,
          email: contactInfo.email,
          facebookURL: contactInfo.facebock,
          whatsappURL: contactInfo.whatsApp,
          telegramURL: contactInfo.telegram,
          instagramURL: contactInfo.instagram,
          xurl: contactInfo.x,
          youtubeURL: contactInfo.youtube,
        },
        t("message"),
      );
      getcontactInfo();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getcontactInfo = async () => {
    const res = await getRequest("/api/public/contact");
    const resData = res.data;
    setContactInfo((prev) => ({
      ...prev,
      phone: resData.phone,
      email: resData.email,
      facebock: resData.facebookURL,
      whatsApp: resData.whatsappURL,
      instagram: resData.instagramURL,
      x: resData.xurl,
      telegram: resData.telegramURL,
      youtube: resData.youtubeURL,
    }));
  };

  useEffect(() => {
    getcontactInfo();
  }, []);

  const clearField = (key) => {
    setContactInfo((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const renderField = (field) => (
    <div key={field.key} className="flex items-center gap-3">
      <span
        className={`admin-stat-icon !h-9 !w-9 !rounded-lg text-base admin-tone-${field.tone}`}
        aria-hidden="true"
      >
        {field.icon}
      </span>
      <div className="min-w-0 flex-1">
        <FormField
          label={field.labelKey ? t(field.labelKey) : field.label}
          htmlFor={`contact-${field.key}`}
        >
          <div className="relative">
            <input
              id={`contact-${field.key}`}
              type={field.type ?? "url"}
              className="admin-input pe-10"
              placeholder={field.placeholder}
              dir={field.dir ?? "ltr"}
              value={contactInfo[field.key]}
              onChange={(e) =>
                setContactInfo((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
            />
            <button
              type="button"
              className="absolute inset-y-0 end-2 my-auto flex h-7 w-7 items-center justify-center rounded-lg text-[#98a2b3] transition-colors hover:bg-[#fbeff2] hover:text-[#b4233a]"
              onClick={() => clearField(field.key)}
              aria-label={t("clear")}
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        </FormField>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col gap-4">
      {loading && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#060f1c]/55 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-2xl">
            <span className="admin-spinner !h-7 !w-7" />
            <p className="text-sm font-semibold text-[#475467]">
              {t("loading")}
            </p>
          </div>
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <section className="admin-card overflow-hidden">
          <div className="admin-card-header">
            <div className="flex items-center gap-3">
              <span className="admin-section-title-icon !h-9 !w-9 text-base">
                <MdContactPage />
              </span>
              <div>
                <h2 className="admin-card-title">{t("contact-details")}</h2>
                <p className="admin-card-description">
                  {t("section_contact_details_description")}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={addContactInfo}
            >
              <MdSave className="text-base" />
              <span className="hidden sm:inline">{t("save-changes")}</span>
            </button>
          </div>
          <div className="admin-card-body">
            <div className="grid gap-4 sm:grid-cols-2">
              {CONTACT_FIELDS.map(renderField)}
            </div>
          </div>
        </section>

        <section className="admin-card overflow-hidden">
          <div className="admin-card-header">
            <div className="flex items-center gap-3">
              <span className="admin-section-title-icon !h-9 !w-9 text-base">
                <IoMdShare />
              </span>
              <div>
                <h2 className="admin-card-title">
                  {t("social-media-links")}
                </h2>
                <p className="admin-card-description">
                  {t("section_social_links_description")}
                </p>
              </div>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_FIELDS.map(renderField)}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e8f0] bg-[#fbfcfe] px-5 py-3">
            <p className="flex items-center gap-2 text-xs text-[#667085]">
              <MdSupportAgent className="text-base" />
              {isArabic
                ? "تظهر هذه الروابط في تذييل المتجر."
                : "These links appear in the storefront footer."}
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-primary admin-btn-sm"
              onClick={addContactInfo}
            >
              <MdSave className="text-base" />
              {t("save-changes")}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
