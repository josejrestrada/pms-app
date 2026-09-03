"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function UnauthorizedAlert({ show }: { show: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) {
      return;
    }

    setVisible(true);
    router.replace(pathname);

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, show]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      role="alert"
    >
      You are not authorized to access that page.
    </div>
  );
}
