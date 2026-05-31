import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { getMaintenanceState } from "@/lib/maintenance-mode";
import { Button } from "@/components/ui/button";

export default async function MaintenancePage() {
  const { maintenanceMode, maintenanceMessage } = await getMaintenanceState();

  if (!maintenanceMode) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Wrench className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Under maintenance
          </h1>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {maintenanceMessage}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          We will be back shortly. Thank you for your patience.
        </p>
        <Link href="/admin/login">
          <Button variant="outline" size="sm">
            Platform admin login
          </Button>
        </Link>
      </div>
    </div>
  );
}
