import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SalesList } from "@/components/tenant/lists/sales-list";
import { ManualSaleForm } from "@/components/sales/manual-sale-form";
import { decimalToNumber } from "@/lib/utils";

export default async function SalesPage() {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();

  const [sales, customers] = await Promise.all([
    prisma.sale.findMany({
    where: { tenantId },
    orderBy: { saleDate: "desc" },
    take: 100,
    include: {
      customer: true,
      user: true,
      items: { include: { product: true } },
    },
  }),
    prisma.customer.findMany({
      where: { tenantId, status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows = sales.map((sale) => ({
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customer?.name || "Walk-in",
    cashierName: sale.user?.name || "—",
    total: decimalToNumber(sale.total),
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    status: sale.status,
    saleDate: sale.saleDate.toISOString(),
    items: sale.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: decimalToNumber(item.quantity),
      returnedQty: decimalToNumber(item.returnedQty),
      product: { name: item.product.name },
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Sales invoice history</p>
        </div>
        <div className="flex gap-2">
          <Link href={tenantDashboardPath(tenant, "/sale-returns")}>
            <Button variant="outline">Sales returns</Button>
          </Link>
          <Link href={tenantDashboardPath(tenant, "/pos")}>
            <Button>New Sale (POS)</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <ManualSaleForm customers={customers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Invoices ({sales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesList tenantSlug={tenant} sales={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
