import "./globals.css";

import { LanguageProvider } from "../context/LanguageContext";
import { IdProvider } from "../context/idContext";
import { OrderDetailsProvider } from "../context/orderDetailsContext";
import { SearchInputProvider } from "../context/searshInputContext";
import { RefreshProvider } from "../context/refreshContext";
import { NamePageInAdminProvider } from "../context/namePageInAdmin";
import { CartDrawerOpenProvider } from "../context/CartDrawerOpenContext";
import { ToastContainer } from "react-toastify";
import RTLController from './components/RTLController.jsx'
import GlobalErrorOverlay from './components/GlobalErrorOverlay.jsx'
import { PwaProvider } from './components/pwa/PwaProvider.jsx'
import { isPwaEnabled } from '../lib/pwa/constants'

import {
  SITE_URL,
  SITE_NAME_AR,
  SITE_NAME_EN,
  DEFAULT_OG_IMAGE,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from "../lib/seo";

// PWA-only metadata is omitted while the kill switch is off. The manifest and
// Apple web-app settings stay defined here so re-enabling needs no code change.
const pwaMetadata = isPwaEnabled
  ? {
      manifest: "/manifest.webmanifest",
      appleWebApp: {
        capable: true,
        title: "Alfa",
        statusBarStyle: "black-translucent",
      },
    }
  : {};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME_AR} | ${SITE_NAME_EN}`,
    template: `%s | ${SITE_NAME_AR}`,
  },
  description:
    "ألفا جروب للتقنية هو متجرك الإلكتروني لشراء أحدث الأجهزة والإلكترونيات. اكتشف تشكيلة متنوعة من المنتجات التقنية بأسعار مميزة وعروض تناسب احتياجاتك.",
  keywords: [
    "ألفا جروب",
    "ألفا جروب للتقنية",
    "إلكترونيات",
    "أجهزة",
    "تسوق إلكتروني",
    "منتجات تقنية",
  ],
  applicationName: "Alfa E-commerce",
  ...pwaMetadata,
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: SITE_URL,
    siteName: SITE_NAME_AR,
    title: `${SITE_NAME_AR} | ${SITE_NAME_EN}`,
    description:
      "اكتشف أحدث الأجهزة والإلكترونيات بأسعار مميزة من ألفا جروب تكنولوجي.",
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME_AR }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME_AR} | ${SITE_NAME_EN}`,
    description:
      "اكتشف أحدث الأجهزة والإلكترونيات بأسعار مميزة من ألفا جروب تكنولوجي.",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

// import { Tajawal } from "next/font/google";

// const tajawal = Tajawal({
//   subsets: ["arabic", "latin"],
//   weight: ["400", "500", "700"],
// });
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "optional",
});

import { Cairo } from "next/font/google";
import localFont from "next/font/local";

// const cairo = plex({
//   subsets: ["arabic", "latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-cairo",
// });

const albertSans = localFont({
  src: "./font/AlbertSans-Regular.woff2",
  weight: "400",
  variable: "--font-albert-sans",
  display: "optional",
  preload: false,
});

const urbanistSemiBold = localFont({
  src: "./font/Urbanist-SemiBold.woff2",
  weight: "600",
  variable: "--font-urbanist-semibold",
  display: "optional",
  preload: false,
});

const urbanistBold = localFont({
  src: "./font/Urbanist-Bold.woff2",
  weight: "700",
  variable: "--font-urbanist-bold",
  display: "optional",
  preload: false,
});

const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL || "").origin;
  } catch {
    return null;
  }
})();

// Keep iOS launch screens in sync with scripts/generate-pwa-assets.ps1.
// Apple matches the logical viewport size and DPR, not the raw image size.
const APPLE_SPLASH_SCREENS = [
  { file: "apple-splash-828x1792.png", width: 414, height: 896, dpr: 2 },
  { file: "apple-splash-1080x2340.png", width: 360, height: 780, dpr: 3 },
  { file: "apple-splash-1125x2436.png", width: 375, height: 812, dpr: 3 },
  { file: "apple-splash-1170x2532.png", width: 390, height: 844, dpr: 3 },
  { file: "apple-splash-1179x2556.png", width: 393, height: 852, dpr: 3 },
  { file: "apple-splash-1206x2622.png", width: 402, height: 874, dpr: 3 },
  { file: "apple-splash-1242x2688.png", width: 414, height: 896, dpr: 3 },
  { file: "apple-splash-1284x2778.png", width: 428, height: 926, dpr: 3 },
  { file: "apple-splash-1290x2796.png", width: 430, height: 932, dpr: 3 },
  { file: "apple-splash-1320x2868.png", width: 440, height: 956, dpr: 3 },
  { file: "apple-splash-1536x2048.png", width: 768, height: 1024, dpr: 2 },
  { file: "apple-splash-1668x2388.png", width: 834, height: 1194, dpr: 2 },
  { file: "apple-splash-2048x2732.png", width: 1024, height: 1366, dpr: 2 },
];

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#0d0625" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {API_ORIGIN ? (
          <>
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        ) : null}
        {isPwaEnabled
          ? APPLE_SPLASH_SCREENS.map((splash) => (
              <link
                key={splash.file}
                rel="apple-touch-startup-image"
                href={`/splash/${splash.file}`}
                media={`(device-width: ${splash.width}px) and (device-height: ${splash.height}px) and (-webkit-device-pixel-ratio: ${splash.dpr}) and (orientation: portrait)`}
              />
            ))
          : null}
        {/* Capture beforeinstallprompt before React hydrates so the custom
            install entry point never misses a browser event. */}
        {isPwaEnabled ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();window.__alfaDeferredInstallPrompt=event;window.dispatchEvent(new Event("alfa:beforeinstallprompt"));});}catch(error){}})();`,
            }}
          />
        ) : null}
      </head>
      <body
        className={`${plex.variable} ${albertSans.variable} ${urbanistSemiBold.variable} ${urbanistBold.variable} bg-[#f6f5f8]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildOrganizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildWebsiteJsonLd()),
          }}
        />

        <ToastContainer
          position={"bottom-center"} />

        <LanguageProvider>
          <PwaProvider>
            <GlobalErrorOverlay />
            <RTLController>
              <IdProvider>

                <SearchInputProvider>
                  <RefreshProvider>
                    <OrderDetailsProvider>
                      <CartDrawerOpenProvider>
                        <NamePageInAdminProvider>
                          {children}

                        </NamePageInAdminProvider>
                      </CartDrawerOpenProvider>

                    </OrderDetailsProvider>
                  </RefreshProvider>
                </SearchInputProvider>
              </IdProvider>
            </RTLController>
          </PwaProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
