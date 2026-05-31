import Link from "next/link";
import { getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Button } from "@/components/ui/button";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { ArrowLeft } from "lucide-react";

export default async function NewPurchasePage() {
  const tenant = await getTenantSlug();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={tenantDashboardPath(tenant, "/purchases")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Purchase</h1>
          <p className="text-muted-foreground">
            Receive stock from supplier — stock updates automatically
          </p>
        </div>
      </div>
      <PurchaseForm />
    </div>
  );
}
