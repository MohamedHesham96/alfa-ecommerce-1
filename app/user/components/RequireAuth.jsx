"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthStorage } from "../../../utils/authSession";

export default function RequireAuth({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasSession = Boolean(
      localStorage.getItem("id") && localStorage.getItem("refreshToken"),
    );

    if (!hasSession) {
      // A missing/expired local session must also drop any cached public API
      // or page HTML that may have been produced while another account was
      // active on this device.
      clearAuthStorage().finally(() => {
        router.replace("/signin");
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
