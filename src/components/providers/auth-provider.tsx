"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "@/lib/auth-client";

const SKIP_SESSION_PREFIXES = ["/maintenance"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipSession = SKIP_SESSION_PREFIXES.some((p) =>
    pathname?.startsWith(p)
  );

  if (skipSession) {
    return <>{children}</>;
  }

  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
