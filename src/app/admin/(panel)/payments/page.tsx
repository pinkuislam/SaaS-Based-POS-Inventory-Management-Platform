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

export default async function PaymentsPage() {
  const payments = await prisma.subscriptionPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      subscription: {
        include: { tenant: true, package: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Payments</h1>
        <p className="text-muted-foreground">
          Platform billing and payment records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payment records yet. Payments are created when tenants subscribe
              via payment gateway integration.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.subscription.tenant.name}
                    </TableCell>
                    <TableCell>{p.subscription.package.name}</TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(p.amount))}
                    </TableCell>
                    <TableCell>{p.method || "—"}</TableCell>
                    <TableCell>
                      <Badge>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                    </TableCell>
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
