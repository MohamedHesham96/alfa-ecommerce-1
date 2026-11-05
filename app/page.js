import HomePageClient from "./components/HomePageClient";
import HomeSeoIntro from "./components/HomeSeoIntro";
import { getAllCategories, getRecentProducts, getSliderImages } from "../lib/api";
import {
  SITE_URL,
  SITE_NAME_AR,
  DEFAULT_OG_IMAGE,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "../lib/seo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    absolute: `${SITE_NAME_AR} | إلكترونيات وأجهزة منزلية`,
  },
  description:
    "تسوق أجهزة استقبال وشاشات وكابلات وأجهزة منزلية وإلكترونيات من ألفا جروب تكنولوجي بأسعار ومواصفات حقيقية.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME_AR,
    locale: "ar_EG",
    title: `${SITE_NAME_AR} | إلكترونيات وأجهزة منزلية`,
    description:
      "تسوق أجهزة استقبال وشاشات وكابلات وأجهزة منزلية وإلكترونيات من ألفا جروب تكنولوجي.",
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME_AR }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME_AR} | إلكترونيات وأجهزة منزلية`,
    description:
      "تسوق أجهزة استقبال وشاشات وكابلات وأجهزة منزلية وإلكترونيات من ألفا جروب تكنولوجي.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HomePage() {
  const [categories, products, sliderImages] = await Promise.all([
    getAllCategories().catch(() => []),
    getRecentProducts().catch(() => []),
    getSliderImages().catch(() => []),
  ]);
  const breadcrumbs = [{ name: "الرئيسية", url: SITE_URL }];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildBreadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <HomePageClient initialSliderImages={sliderImages}>
        <HomeSeoIntro categories={categories} products={products} />
      </HomePageClient>
    </>
  );
}
