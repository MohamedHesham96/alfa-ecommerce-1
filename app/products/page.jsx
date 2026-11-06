import { cache } from "react";
import { notFound } from "next/navigation";
import CategoryProductsClient from "../components/CategoryProductsClient";
import { getAllCategories, normalizePagePayload, searchProducts } from "../../lib/api";
import {
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildProductsIndexMetadata,
  serializeJsonLd,
} from "../../lib/seo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

const loadCategories = cache(getAllCategories);
const loadProducts = cache((page) => searchProducts({ page, size: 40 }));

function pageFromSearchParams(searchParams) {
  const raw = Number(searchParams?.page);
  if (!Number.isFinite(raw) || raw <= 1) return 0;
  return Math.max(0, Math.floor(raw) - 1);
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  return buildProductsIndexMetadata(pageFromSearchParams(resolvedSearchParams));
}

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const page = pageFromSearchParams(resolvedSearchParams);
  const products = await loadProducts(page);
  const categories = await loadCategories();
  const productsPage = normalizePagePayload(products, 40);
  const content = productsPage.content;
  const totalElements = productsPage.totalElements;
  const totalPages = productsPage.totalPages;
  const number = productsPage.number;

  if (page > 0 && totalElements > 0 && content.length === 0) {
    notFound();
  }

  const breadcrumbs = [
    { name: "الرئيسية", url: SITE_URL },
    { name: "كل المنتجات", url: `${SITE_URL}/products` },
  ];

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildBreadcrumbJsonLd(breadcrumbs)),
        }}
      />
      <CategoryProductsClient
        category={null}
        categories={categories}
        initialProducts={content}
        initialPage={number}
        initialTotalPages={totalPages}
        initialTotalElements={totalElements}
        basePath="/products"
        description="تصفح كل منتجات ألفا جروب تكنولوجي: أجهزة استقبال، شاشات، كابلات، أجهزة منزلية وإلكترونيات بأسعار تنافسية ومواصفات واضحة."
      />
    </div>
  );
}
