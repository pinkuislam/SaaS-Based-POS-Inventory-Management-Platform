"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function ImpersonationBanner() {
  const { data: session } = useSession();
  const impersonatedBy = session?.user?.impersonatedBy;

  if (!impersonatedBy) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Support mode: viewing as <strong>{session?.user?.tenantName}</strong>
          {session?.user?.impersonatedByName
            ? ` (admin: ${session.user.impersonatedByName})`
            : ""}
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 shrink-0"
        onClick={() => signOut({ callbackUrl: "/admin/dashboard" })}
      >
        Exit support mode
      </Button>
    </div>
  );
}
