import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import CategoryProductsClient from "../../components/CategoryProductsClient";
import {
  getAllCategories,
  getCategoryBySlug,
  getSeoRedirect,
  normalizePagePayload,
  searchProducts,
} from "../../../lib/api";
import {
  SITE_URL,
  categoryDescription,
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
  buildCategoryMetadata,
  categoryBreadcrumbs,
  categoryPageUrl,
  categoryPath,
  productDisplayName,
  serializeJsonLd,
} from "../../../lib/seo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

const loadCategory = cache(getCategoryBySlug);
const loadCategories = cache(getAllCategories);
const loadProducts = cache((categoryId, page) =>
  searchProducts({ page, size: 40, categoryId }),
);

function pageFromSearchParams(searchParams) {
  const raw = Number(searchParams?.page);
  if (!Number.isFinite(raw) || raw <= 1) return 0;
  return Math.max(0, Math.floor(raw) - 1);
}

async function resolveCategory(slug) {
  const category = await loadCategory(slug);
  if (category) return category;

  const redirect = await getSeoRedirect("category", slug);
  if (redirect?.newSlug && redirect.targetExists !== false) {
    permanentRedirect(`/categories/${encodeURIComponent(redirect.newSlug)}`);
  }
  notFound();
}

export async function generateMetadata({ params, searchParams }) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const decodedSlug = decodeURIComponent(slug);
  const page = pageFromSearchParams(resolvedSearchParams);
  const category = await resolveCategory(decodedSlug);
  const categories = await loadCategories();
  const categoryWithCount =
    categories.find(
      (item) => item.itemCategoryId === category.itemCategoryId,
    ) || category;
  const products = await loadProducts(category.itemCategoryId, page);
  const productsPage = normalizePagePayload(products, 40);
  const itemsCount = Number(
    categoryWithCount.itemsCount ?? productsPage.totalElements ?? 0,
  );
  const topNames = productsPage.content
    .slice(0, 3)
    .map((product) => productDisplayName(product, "ar"))
    .filter(Boolean);

  return buildCategoryMetadata(categoryWithCount, {
    itemsCount,
    topNames,
    page,
  });
}

export default async function CategoryPage({ params, searchParams }) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const decodedSlug = decodeURIComponent(slug);
  const page = pageFromSearchParams(resolvedSearchParams);
  const category = await resolveCategory(decodedSlug);
  const categories = await loadCategories();
  const categoryWithCount =
    categories.find(
      (item) => item.itemCategoryId === category.itemCategoryId,
    ) || category;

  const products = await loadProducts(category.itemCategoryId, page);
  const productsPage = normalizePagePayload(products, 40);
  const totalElements = productsPage.totalElements;
  const totalPages = productsPage.totalPages;
  const number = productsPage.number;
  const content = productsPage.content;

  if (page > 0 && totalElements > 0 && content.length === 0) {
    notFound();
  }

  const breadcrumbs = categoryBreadcrumbs(categoryWithCount, page);
  const categoryJsonLd = buildCollectionJsonLd(
    categoryWithCount,
    content,
    page,
  );
  const canonical = `${SITE_URL}${categoryPageUrl(categoryWithCount, page)}`;
  const topNames = content
    .slice(0, 3)
    .map((product) => productDisplayName(product, "ar"))
    .filter(Boolean);
  const intro = categoryDescription(
    categoryWithCount,
    totalElements,
    topNames,
  );

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildBreadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            ...categoryJsonLd,
            url: canonical,
          }),
        }}
      />
      <CategoryProductsClient
        category={categoryWithCount}
        categories={categories}
        initialProducts={content}
        initialPage={number}
        initialTotalPages={totalPages}
        initialTotalElements={totalElements}
        basePath={categoryPath(categoryWithCount)}
        description={intro}
      />
    </div>
  );
}
