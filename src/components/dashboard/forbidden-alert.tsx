"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

function ForbiddenAlertInner() {
  const searchParams = useSearchParams();
  if (searchParams.get("error") !== "forbidden") return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
        You do not have permission to access that page. Contact your administrator
        if you need access.
      </AlertDescription>
    </Alert>
  );
}

export function ForbiddenAlert() {
  return (
    <Suspense fallback={null}>
      <ForbiddenAlertInner />
    </Suspense>
  );
}
