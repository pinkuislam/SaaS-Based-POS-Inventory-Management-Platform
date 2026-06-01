import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoicePrint } from "@/components/sales/invoice-print";
import { SaleReturnDialog } from "@/components/sales/sale-return-dialog";
import { SaleVoidDialog } from "@/components/sales/sale-void-dialog";
import { ArrowLeft } from "lucide-react";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenantId = await getTenantId();
  const tenant = await getTenantSlug();
  const { id } = await params;

  const sale = await prisma.sale.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      user: true,
      tenant: true,
      items: { include: { product: true } },
    },
  });

  if (!sale) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href={tenantDashboardPath(tenant, "/sales")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-mono">{sale.invoiceNo}</h1>
            <div className="flex gap-2 mt-1">
              <Badge>{sale.status}</Badge>
              <Badge variant="outline">{sale.paymentStatus}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {sale.status === "COMPLETED" && (
            <SaleReturnDialog
              saleId={sale.id}
              invoiceNo={sale.invoiceNo}
              items={sale.items}
              status={sale.status}
            />
          )}
          <SaleVoidDialog
            saleId={sale.id}
            invoiceNo={sale.invoiceNo}
            status={sale.status}
          />
        </div>
      </div>

      <InvoicePrint sale={sale} />
    </div>
  );
}
