import SplashScreen from "../components/splash/SplashScreen";
import { SITE_NAME_AR } from "../../lib/seo";

export const metadata = {
  title: {
    absolute: `مرحبًا بك | ${SITE_NAME_AR}`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Standalone entry point for campaigns and the installed app. The regular
 * homepage shows the same intro once per tab session.
 */
export default function WelcomePage() {
  return <SplashScreen mode="page" redirectTo="/" />;
}
