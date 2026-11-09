/** @type {import('next').NextConfig} */
const imageEnvOrigins = [
  process.env.NEXT_PUBLIC_API_BASE_URL,
  process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL,
].filter(Boolean);

const canonicalSiteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://alfagrouptech.com"
).replace(/\/+$/, "");
const canonicalHost = new URL(canonicalSiteUrl).hostname;
const wwwHost = canonicalHost.startsWith("www.") ? null : `www.${canonicalHost}`;

// Old product slugs that must never serve duplicate product pages. The proxy
// and the SEO redirect API handle these too; keeping the permanent redirects
// here guarantees the routing layer catches them before any cached page.
const legacyProductRedirects = [
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
].map(([source, destination]) => ({
  source,
  destination,
  permanent: true,
}));

const allowsLocalImageIP =
  process.env.NEXT_PUBLIC_ALLOW_LOCAL_IMAGE_IP === "true" ||
  (process.env.NODE_ENV !== "production" &&
    imageEnvOrigins.some((value) => {
      try {
        const hostname = new URL(value).hostname.toLowerCase();
        return (
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname === "::1" ||
          hostname === "[::1]"
        );
      } catch {
        return false;
      }
    }));

const remotePatterns = [
  {
    protocol: "http",
    hostname: "209.50.228.90",
  },
  {
    protocol: "https",
    hostname: "209.50.228.90",
  },
  {
    protocol: "https",
    hostname: "alfagrouptech.com",
  },
  {
    protocol: "https",
    hostname: "www.alfagrouptech.com",
  },
  {
    protocol: "https",
    hostname: "souq.alfagroup.it.com",
  },
];

if (allowsLocalImageIP) {
  remotePatterns.push({ protocol: "http", hostname: "localhost" });
}

const nextConfig = {
  // Release builds use a separate output dir and standalone output so a new
  // build never touches the .next directory served by the live process.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  poweredByHeader: false,
  trailingSlash: false,
  async redirects() {
    return [
      ...(wwwHost
        ? [
            {
              source: "/:path*",
              has: [{ type: "host", value: wwwHost }],
              destination: `${canonicalSiteUrl}/:path*`,
              permanent: true,
            },
          ]
        : []),
      ...legacyProductRedirects,
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [65, 75, 85],
    minimumCacheTTL: 2592000,
    // Only allow local media hosts in local/e2e builds. Production hosts must
    // remain blocked by Next.js 16's local-IP SSRF protection.
    dangerouslyAllowLocalIP: allowsLocalImageIP,
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns,
  },
  async headers() {
    const noIndexFollow = [
      { key: "X-Robots-Tag", value: "noindex, follow" },
    ];
    const noIndexNoFollow = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];

    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/sw-policies.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800" },
        ],
      },
      {
        source: "/splash/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800" },
        ],
      },
      { source: "/admin/:path*", headers: noIndexNoFollow },
      { source: "/signin", headers: noIndexNoFollow },
      { source: "/signup", headers: noIndexNoFollow },
      { source: "/forgotpassword", headers: noIndexNoFollow },
      { source: "/confirmedemail", headers: noIndexNoFollow },
      { source: "/email-failed", headers: noIndexNoFollow },
      { source: "/user/cart/:path*", headers: noIndexNoFollow },
      { source: "/user/profile/:path*", headers: noIndexNoFollow },
      { source: "/user/wishlist/:path*", headers: noIndexNoFollow },
      { source: "/user/ordershistory/:path*", headers: noIndexNoFollow },
      { source: "/user/orderdetails/:path*", headers: noIndexNoFollow },
      { source: "/user/returnorders/:path*", headers: noIndexNoFollow },
      { source: "/user/returnorderdetails/:path*", headers: noIndexNoFollow },
      { source: "/__reviews-preview/:path*", headers: noIndexNoFollow },
      { source: "/user/search/:path*", headers: noIndexFollow },
      { source: "/user/home", headers: noIndexFollow },
      { source: "/user/products/section/:path*", headers: noIndexFollow },
    ];
  },
};

export default nextConfig;
