import { SITE_NAME_AR, SITE_URL } from "../../../lib/seo";

// /user/home is the client-rendered storefront shell used by the PWA. The
// public home page is "/" (which adds the server-rendered SEO intro), so this
// route must not compete with it as a duplicate page in Google's index.
export const metadata = {
  title: {
    absolute: `${SITE_NAME_AR} | إلكترونيات وأجهزة منزلية`,
  },
  alternates: { canonical: SITE_URL },
  robots: { index: false, follow: true },
};

export default function UserHomeLayout({ children }) {
  return children;
}
