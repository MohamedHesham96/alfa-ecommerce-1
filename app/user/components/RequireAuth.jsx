"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthStorage } from "../../../utils/authSession";
import {
  buildSignInUrl,
  getCurrentRelativeUrl,
} from "../../../utils/authRedirect";
import { hasStoredSession } from "../../../utils/authRole";

export default function RequireAuth({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasStoredSession()) {
      // Keep the destination (path, parameters and hash) so the user returns
      // to this exact page after signing in.
      const returnUrl = getCurrentRelativeUrl();

      // A missing/expired local session must also drop any cached public API
      // or page HTML that may have been produced while another account was
      // active on this device.
      clearAuthStorage().finally(() => {
        router.replace(buildSignInUrl(returnUrl));
      });
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="w-full min-h-[40vh]" />;
  }

  return children;
}
