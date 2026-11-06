import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8787"
).replace(/\/+$/, "");

const CANONICAL_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://alfagrouptech.com";
const CANONICAL_HOST = new URL(CANONICAL_SITE_URL).hostname;

async function fetchData(path) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (response.status === 404) {
      return { status: 404, data: null };
    }
    if (!response.ok) {
      return { status: response.status, data: null };
    }
    const json = await response.json();
    return { status: response.status, data: json?.data ?? json };
  } catch {
    return { status: 0, data: null };
  }
}

function notFoundResponse() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Permanent (301) redirects for legacy id/name URLs.
 *
 * These routes were publicly indexed but are duplicate-prone: the old product
 * URL resolved any name for the same id. The canonical URLs are /products/:slug
 * and /categories/:slug. Only legacy paths hit the API here, so canonical product
 * views pay no middleware lookup cost.
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // One canonical hostname: https://alfagrouptech.com (not www).
  if (
    CANONICAL_HOST &&
    !CANONICAL_HOST.startsWith("www.") &&
    request.nextUrl.hostname === `www.${CANONICAL_HOST}`
  ) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const productMatch = pathname.match(
    /^\/user\/productdetails\/([^/]+)\/([^/]+)\/?$/,
  );
  if (productMatch) {
    const id = decodeURIComponent(productMatch[2]);
    if (/^\d+$/.test(id)) {
      const result = await fetchData(`/api/public/items/${id}`);
      if (result.status === 404) {
        return notFoundResponse();
      }
      if (result.data?.seoCode) {
        return NextResponse.redirect(
          new URL(`/products/${encodeURIComponent(result.data.seoCode)}`, request.url),
          301,
        );
      }
    }
    return NextResponse.next();
  }

  const categoryMatch = pathname.match(
    /^\/user\/products\/category\/([^/]+)\/([^/]+)\/?$/,
  );
  if (categoryMatch) {
    const categoryName = decodeURIComponent(categoryMatch[1]);
    const id = decodeURIComponent(categoryMatch[2]);

    if (categoryName === "all" || id === "null") {
      return NextResponse.redirect(new URL("/products", request.url), 301);
    }

    if (/^\d+$/.test(id)) {
      const result = await fetchData(`/api/public/itemCategory/${id}`);
      if (result.status === 404) {
        return notFoundResponse();
      }
      if (result.data?.seoCode) {
        return NextResponse.redirect(
          new URL(`/categories/${encodeURIComponent(result.data.seoCode)}`, request.url),
          301,
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|Images|favicon.ico|api|sw\\.js|sw-policies\\.js|offline\\.html|manifest\\.webmanifest|icons/|splash/).*)",
  ],
};
