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

export default async function AdminBillingPage() {
  const [checkouts, tenants] = await Promise.all([
    prisma.billingCheckout.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.tenant.findMany({
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Checkout Sessions</h1>
        <p className="text-muted-foreground">
          Stripe and SSLCommerz checkout records (platform invoices)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checkout History ({checkouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {checkouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No checkout sessions yet. Tenants pay from Settings → Billing.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkouts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {tenantMap[c.tenantId]?.name || c.tenantId}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(c.amount))}{" "}
                      <span className="text-xs text-muted-foreground">
                        {c.currency}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{c.gateway}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "completed" ? "default" : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[120px] truncate">
                      {c.externalRef || "—"}
                    </TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
