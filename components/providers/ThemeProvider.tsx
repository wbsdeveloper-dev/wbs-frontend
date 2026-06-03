"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && (pathname.includes("/bbm") || pathname.includes("-bbm"))) {
      document.body.setAttribute("data-theme", "bbm");
    } else {
      document.body.removeAttribute("data-theme");
    }
  }, [pathname]);

  return <>{children}</>;
}
