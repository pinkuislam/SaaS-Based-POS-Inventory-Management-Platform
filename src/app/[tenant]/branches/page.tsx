import { Suspense } from "react";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchFormDialog } from "@/components/branches/branch-form-dialog";
import { BranchesTable } from "@/components/branches/branches-table";
import { ShowArchivedBranches } from "@/components/branches/show-archived-branches";
import { activeBranchWhere, parseBranchSettings } from "@/lib/branches";
import { decimalToNumber } from "@/lib/utils";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const { show } = await searchParams;
  const showAll = show === "all";

  const branches = await prisma.branch.findMany({
    where: showAll
      ? { tenantId }
      : { ...activeBranchWhere(tenantId), isActive: true },
    include: {
      manager: { select: { name: true } },
      _count: { select: { users: true } },
    },
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
  });

  const rows = branches.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    address: b.address,
    contactPerson: b.contactPerson,
    phone: b.phone,
    email: b.email,
    openingBalance:
      b.openingBalance != null ? decimalToNumber(b.openingBalance) : null,
    managerId: b.managerId,
    managerName: b.manager?.name ?? null,
    isMain: b.isMain,
    isActive: b.isActive,
    deletedAt: b.deletedAt?.toISOString() ?? null,
    userCount: b._count.users,
    settings: parseBranchSettings(b.settings),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-muted-foreground">
            Multi-branch management — create, view, and manage locations
          </p>
        </div>
        <BranchFormDialog />
      </div>

      <Suspense fallback={null}>
        <ShowArchivedBranches tenantSlug={tenantSlug} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Branch List</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchesTable tenantSlug={tenantSlug} branches={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
