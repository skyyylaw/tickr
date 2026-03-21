"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    console.log(`[tickr:pageview] ${pathname} at ${new Date().toISOString()}`);
  }, [pathname]);

  return null;
}
