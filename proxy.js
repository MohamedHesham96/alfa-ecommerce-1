import { NextResponse } from "next/server";

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8787"
).replace(/\/+$/, "");

const CANONICAL_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://alfagrouptech.com";
const CANONICAL_HOST = new URL(CANONICAL_SITE_URL).hostname.toLowerCase();

// Old product slugs that must never serve duplicate product pages. The SEO
// redirect API handles these too, but a static map guarantees a permanent
// redirect even when an old page is still present in the Next.js cache.
const LEGACY_PRODUCT_REDIRECTS = new Map([
  ["/products/senator", "/products/senator-111-max-receiver"],
  ["/products/receiver-senator-888", "/products/senator-888-receiver"],
  ["/products/hulk-receiver", "/products/senator-hulk-receiver"],
  ["/products/captain-receiver", "/products/captain-q2-4k-receiver"],
  ["/products/platinum-p2-receiver", "/products/senator-platinum-p2-receiver"],
  ["/products/9900-gold-v2-receiver", "/products/senator-9900-gold-v2-receiver"],
  ["/products/senator-cat6-cable", "/products/senator-cat6-network-cable-305-gray"],
  ["/products/4k-cable-1-5m", "/products/hdmi-cable-1-5m-4k"],
  ["/products/4k-cable-3m", "/products/hdmi-cable-3m-4k"],
  ["/products/4k-cable-5m", "/products/hdmi-cable-5m-4k"],
  ["/products/4k-cable-10m", "/products/hdmi-cable-10m-4k"],
  ["/products/4k-cable-15m", "/products/hdmi-cable-15m-4k"],
  ["/products/4k-cable-20m", "/products/hdmi-cable-20m-4k"],
  ["/products/cable-300-gold-96-reel-gold-senator", "/products/senator-cable-300-gold-96-reel"],
  ["/products/senator9900", "/products/senator-9900-tempo-receiver"],
]);

// Legacy slugs that contain spaces or Arabic characters cannot be looked up
// through the backend (Tomcat rejects them with 400). Match their decoded or
// encoded prefix and redirect to the clean current slug.
const LEGACY_PRODUCT_PREFIX_REDIRECTS = [
  ["/products/gt-120-fixed-monitor-mount-70-120", "/products/senator-gt-120-fixed-monitor-mount-70-120"],
  ["/products/sf-20f-fixed-monitor-mount-14-42", "/products/senator-sf-20f-fixed-monitor-mount-14-42"],
  ["/products/sf-65f-super-26-60-fixed-monitor-mount", "/products/senator-sf-65f-super-26-60-fixed-monitor-mount"],
  ["/products/st-600g-32-80-movable-monitor-stand", "/products/senator-st-600g-32-80-movable-monitor-stand"],
  ["/products/t.v senator", "/products/senator-43-smart-tv"],
  ["/products/سيانتور كابل", "/products/cable-100-white-48-box-black-senator"],
];

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

function permanentRedirect(request, destination) {
  return NextResponse.redirect(new URL(destination, request.url), 301);
}

function decodePathSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function legacyProductRedirect(pathname) {
  let decodedPathname = pathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    // Keep the raw pathname when it contains a literal percent sign.
  }

  const exactTarget = LEGACY_PRODUCT_REDIRECTS.get(decodedPathname);
  if (exactTarget) return exactTarget;

  for (const [prefix, destination] of LEGACY_PRODUCT_PREFIX_REDIRECTS) {
    if (
      decodedPathname === prefix ||
      decodedPathname.startsWith(`${prefix} `) ||
      decodedPathname.startsWith(`${prefix}%20`)
    ) {
      return destination;
    }
  }

  return null;
}

// Valid Server Action IDs are exactly 42 characters long. Scanners routinely
// POST to public Next.js sites with a bogus `Next-Action: x` header, which
// makes the App Router throw and log "The Server Reference ID did not match
// the expected format" for every probe. Reject malformed IDs at the edge so
// they never reach the action handler (and never spam the production logs).
const SERVER_REFERENCE_ID_LENGTH = 42;

/**
 * Permanent (301) redirects for legacy id/name URLs and old product slugs.
 *
 * These routes were publicly indexed but are duplicate-prone: the old product
 * URL resolved any name for the same id, and old slugs could remain in the
 * Next.js cache after an admin slug change. Only legacy paths hit the API here,
 * so canonical product views pay no middleware lookup cost.
 */
export async function proxy(request) {
  const actionId = request.headers.get("next-action");
  if (actionId !== null && actionId.length !== SERVER_REFERENCE_ID_LENGTH) {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { pathname } = request.nextUrl;

  // One canonical hostname: https://alfagrouptech.com (not www). Read the
  // original host from the proxy headers so this also works when nginx
  // forwards the request to Next.js on an internal hostname.
  const forwardedHost = request.headers.get("x-forwarded-host") || "";
  const hostHeader = request.headers.get("host") || "";
  const requestHost = (
    forwardedHost.split(",")[0].trim() ||
    hostHeader.split(":")[0].trim() ||
    request.nextUrl.hostname
  ).toLowerCase();

  if (
    CANONICAL_HOST &&
    !CANONICAL_HOST.startsWith("www.") &&
    requestHost === `www.${CANONICAL_HOST}`
  ) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const legacyProductTarget = legacyProductRedirect(pathname);
  if (legacyProductTarget) {
    return permanentRedirect(request, legacyProductTarget);
  }

  const productMatch = pathname.match(
    /^\/user\/productdetails\/([^/]+)\/([^/]+)\/?$/,
  );
  if (productMatch) {
    const id = decodePathSegment(productMatch[2]);
    if (!/^\d+$/.test(id)) {
      return notFoundResponse();
    }

    const result = await fetchData(`/api/public/items/${id}`);
    if (result.status === 404 || result.status === 400) {
      return notFoundResponse();
    }
    if (result.data?.seoCode) {
      return NextResponse.redirect(
        new URL(`/products/${encodeURIComponent(result.data.seoCode)}`, request.url),
        301,
      );
    }
    return notFoundResponse();
  }

  const categoryMatch = pathname.match(
    /^\/user\/products\/category\/([^/]+)\/([^/]+)\/?$/,
  );
  if (categoryMatch) {
    const categoryName = decodePathSegment(categoryMatch[1]);
    const id = decodePathSegment(categoryMatch[2]);

    if (categoryName === "all" || id === "null") {
      return NextResponse.redirect(new URL("/products", request.url), 301);
    }

    if (!/^\d+$/.test(id)) {
      return notFoundResponse();
    }

    const result = await fetchData(`/api/public/itemCategory/${id}`);
    if (result.status === 404 || result.status === 400) {
      return notFoundResponse();
    }
    if (result.data?.seoCode) {
      return NextResponse.redirect(
        new URL(`/categories/${encodeURIComponent(result.data.seoCode)}`, request.url),
        301,
      );
    }
    return notFoundResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|Images|favicon.ico|api|sw\\.js|sw-policies\\.js|offline\\.html|manifest\\.webmanifest|icons/|splash/).*)",
  ],
};
