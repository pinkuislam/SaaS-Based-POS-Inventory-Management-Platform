import { Suspense } from "react";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { activeCustomerWhere } from "@/lib/customers";
import { prisma } from "@/lib/prisma";
import { ShowArchivedCustomers } from "@/components/customers/show-archived-customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomerGroupsPanel } from "@/components/customers/customer-groups-panel";
import {
  serializeCustomerForEdit,
  serializeDueSale,
} from "@/lib/serialize";
import { decimalToNumber } from "@/lib/utils";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { show } = await searchParams;
  const showAll = show === "all";

  const [customers, dueSales] = await Promise.all([
    prisma.customer.findMany({
      where: showAll
        ? { tenantId }
        : activeCustomerWhere(tenantId),
      orderBy: { name: "asc" },
    }),
    prisma.sale.findMany({
      where: {
        tenantId,
        dueAmount: { gt: 0 },
        status: "COMPLETED",
        customerId: { not: null },
      },
      select: {
        id: true,
        invoiceNo: true,
        dueAmount: true,
        saleDate: true,
        customerId: true,
      },
    }),
  ]);

  const duesByCustomer = new Map<string, ReturnType<typeof serializeDueSale>[]>();
  for (const sale of dueSales) {
    if (!sale.customerId) continue;
    const list = duesByCustomer.get(sale.customerId) || [];
    list.push(serializeDueSale(sale));
    duesByCustomer.set(sale.customerId, list);
  }

  const rows = customers.map((c) => ({
    ...serializeCustomerForEdit(c),
    status: c.status,
    deletedAt: c.deletedAt?.toISOString() ?? null,
    loyaltyPoints: decimalToNumber(c.loyaltyPoints),
    dueSales: duesByCustomer.get(c.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information ({customers.length})
          </p>
        </div>
        <CustomerFormDialog />
      </div>

      <CustomerGroupsPanel />

      <Suspense>
        <ShowArchivedCustomers tenantSlug={tenantSlug} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersTable customers={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
