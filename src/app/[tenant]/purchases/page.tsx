import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchasesTable } from "@/components/purchases/purchases-table";
import { decimalToNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function PurchasesPage() {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();

  const purchases = await prisma.purchase.findMany({
    where: { tenantId },
    orderBy: { purchaseDate: "desc" },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });

  const rows = purchases.map((p) => ({
    id: p.id,
    invoiceNo: p.invoiceNo,
    supplierName: p.supplier?.name || "—",
    total: decimalToNumber(p.total),
    paidAmount: decimalToNumber(p.paidAmount),
    dueAmount: decimalToNumber(p.dueAmount),
    paymentStatus: p.paymentStatus,
    status: p.status,
    purchaseDate: p.purchaseDate.toISOString(),
    items: p.items.map((item) => ({
      id: item.id,
      quantity: decimalToNumber(item.quantity),
      returnedQty: decimalToNumber(item.returnedQty),
      product: { name: item.product.name },
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">Supplier purchase records</p>
        </div>
        <div className="flex gap-2">
          <Link href={tenantDashboardPath(tenant, "/purchase-returns")}>
            <Button variant="outline">Purchase returns</Button>
          </Link>
          <Link href={tenantDashboardPath(tenant, "/purchases/new")}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Invoices ({purchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No purchases yet. Create your first purchase order.
              </p>
              <Link href={tenantDashboardPath(tenant, "/purchases/new")}>
                <Button>Create Purchase</Button>
              </Link>
            </div>
          ) : (
            <PurchasesTable purchases={rows} tenantSlug={tenant} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
