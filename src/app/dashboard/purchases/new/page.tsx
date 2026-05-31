import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { ArrowLeft } from "lucide-react";

export default function NewPurchasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases">
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
