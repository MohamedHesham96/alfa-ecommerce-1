import HomePageClient from "./components/HomePageClient";
import HomeSeoIntro from "./components/HomeSeoIntro";
import {
  getAllCategories,
  getContact,
  getOffers,
  getRecentProducts,
  getSliderImages,
} from "../lib/api";
import {
  SITE_URL,
  SITE_NAME_AR,
  DEFAULT_OG_IMAGE,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "../lib/seo";

// The route shell contains no prices, inventory, or user data: product
// prices and availability are fetched live in the browser. Caching the shell
// lets Next serve the pre-built document instead of re-rendering it for every
// visitor, which is important because the origin has no CDN cache in front of
// it. The 5-minute window only affects non-transactional content (slider
// images, category names, SEO copy) and is revalidated in the background.
export const revalidate = 300;

export const metadata = {
  title: {
    absolute: `${SITE_NAME_AR} | إلكترونيات وأجهزة منزلية`,
  },
  description:
    "تسوق أجهزة استقبال وشاشات وكابلات وأجهزة منزلية وإلكترونيات من ألفا جروب تكنولوجي بأسعار تنافسية ومواصفات واضحة.",
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
  const [categories, products, sliderImages, offers, contact] = await Promise.all([
    getAllCategories().catch(() => []),
    getRecentProducts().catch(() => []),
    getSliderImages().catch(() => []),
    getOffers().catch(() => []),
    getContact().catch(() => null),
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
      <HomePageClient
        initialSliderImages={sliderImages}
        initialCategories={categories}
        initialOffers={offers}
        initialContact={contact}
      >
        <HomeSeoIntro categories={categories} products={products} />
      </HomePageClient>
    </>
  );
}
