import { notFound, permanentRedirect } from "next/navigation";
import ProductDetails from "../../user/productdetails/components/productDetails";
import {
  getProductBySlug,
  getRelatedProducts,
  getSeoRedirect,
  getSeoSitemap,
} from "../../../lib/api";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductMetadata,
  productBreadcrumbs,
  serializeJsonLd,
} from "../../../lib/seo";

export const revalidate = 300;

/**
 * Pre-render every current product from the same catalogue query that feeds
 * the sitemap. If the backend is unavailable during a build the list is empty
 * and the route still works on demand (dynamicParams defaults to true).
 */
export async function generateStaticParams() {
  // Use an uncached sitemap during the build: a stale cached catalogue must
  // not make the build prerender product pages while the backend is offline.
  const catalogue = await getSeoSitemap({ fresh: true });
  return (catalogue.products || [])
    .map((product) => product?.slug)
    .filter(
      (slug) =>
        typeof slug === "string" &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
    )
    .map((slug) => ({ slug }));
}

async function resolveProduct(slug) {
  const product = await getProductBySlug(slug);
  if (product) return product;

  const redirect = await getSeoRedirect("item", slug);
  if (redirect?.newSlug && redirect.targetExists !== false) {
    permanentRedirect(`/products/${encodeURIComponent(redirect.newSlug)}`);
  }
  notFound();
}

/**
 * Server-render a small set of same-category products. Besides being useful
 * navigation, these are real internal links: without them every product page
 * is a crawl dead-end that Google can only reach through the listing pages.
 */
async function loadRelatedProducts(product) {
  if (!product?.itemId) return [];

  try {
    return await getRelatedProducts(product.itemId, 8);
  } catch {
    // Related products are an enhancement; never fail the product page for them.
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const product = await resolveProduct(decodedSlug);
  return buildProductMetadata(product);
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const product = await resolveProduct(decodedSlug);

  if (product.seoCode && product.seoCode !== decodedSlug) {
    permanentRedirect(`/products/${encodeURIComponent(product.seoCode)}`);
  }

  const breadcrumbs = productBreadcrumbs(product);
  const relatedProducts = await loadRelatedProducts(product);

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildProductJsonLd(product)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildBreadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <ProductDetails
        itemId={product.itemId}
        initialProduct={product}
        categorySlug={product.itemCategory?.seoCode}
        relatedProducts={relatedProducts}
      />
      <hr />
    </div>
  );
}
