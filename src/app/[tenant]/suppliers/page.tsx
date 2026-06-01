import { Suspense } from "react";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { activeSupplierWhere } from "@/lib/suppliers";
import { prisma } from "@/lib/prisma";
import { ShowArchivedSuppliers } from "@/components/suppliers/show-archived-suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import {
  serializeSupplierForEdit,
  serializeDuePurchase,
} from "@/lib/serialize";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { show } = await searchParams;
  const showAll = show === "all";

  const [suppliers, duePurchases] = await Promise.all([
    prisma.supplier.findMany({
      where: showAll ? { tenantId } : activeSupplierWhere(tenantId),
      orderBy: { name: "asc" },
    }),
    prisma.purchase.findMany({
      where: {
        tenantId,
        dueAmount: { gt: 0 },
        status: "COMPLETED",
      },
      select: {
        id: true,
        invoiceNo: true,
        dueAmount: true,
        supplierId: true,
      },
    }),
  ]);

  const duesBySupplier = new Map<
    string,
    ReturnType<typeof serializeDuePurchase>[]
  >();
  for (const p of duePurchases) {
    if (!p.supplierId) continue;
    const list = duesBySupplier.get(p.supplierId) || [];
    list.push(serializeDuePurchase(p));
    duesBySupplier.set(p.supplierId, list);
  }

  const rows = suppliers.map((s) => ({
    ...serializeSupplierForEdit(s),
    status: s.status,
    deletedAt: s.deletedAt?.toISOString() ?? null,
    duePurchases: duesBySupplier.get(s.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage supplier contacts ({suppliers.length})
          </p>
        </div>
        <SupplierFormDialog />
      </div>
      <Suspense>
        <ShowArchivedSuppliers tenantSlug={tenantSlug} />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          <SuppliersTable suppliers={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
