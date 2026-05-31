import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { serializeSubscription } from "@/lib/serialize";
import { SubscriptionFormDialog } from "@/components/admin/subscription-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function SubscriptionsPage() {
  const [subscriptions, tenants, packages] = await Promise.all([
    prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { tenant: true, package: true },
  }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">All tenant subscription records</p>
        </div>
        <SubscriptionFormDialog tenants={tenants} packages={packages} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.tenant.name}
                  </TableCell>
                  <TableCell>{sub.package.name}</TableCell>
                  <TableCell>
                    {formatCurrency(decimalToNumber(sub.amount))}
                  </TableCell>
                  <TableCell>{formatDate(sub.startDate)}</TableCell>
                  <TableCell>{formatDate(sub.endDate)}</TableCell>
                  <TableCell>
                    <Badge>{sub.status}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <SubscriptionFormDialog
                      tenants={tenants}
                      packages={packages}
                      subscription={serializeSubscription(sub)}
                      mode="edit"
                    />
                    <DeleteButton url={`/api/admin/subscriptions/${sub.id}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
