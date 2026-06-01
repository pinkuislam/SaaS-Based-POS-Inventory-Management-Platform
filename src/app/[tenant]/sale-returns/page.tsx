import Link from "next/link";
import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { tenantDashboardPath } from "@/lib/tenant-path";
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

export default async function SaleReturnsPage() {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();

  const returns = await prisma.saleReturn.findMany({
    where: { tenantId },
    orderBy: { returnDate: "desc" },
    include: {
      sale: { select: { invoiceNo: true } },
      customer: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales Returns</h1>
        <p className="text-muted-foreground">
          Customer returns, refunds, and stock restoration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returns ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No returns yet. Process a return from a{" "}
              <Link
                href={tenantDashboardPath(tenantSlug, "/sales")}
                className="text-primary hover:underline"
              >
                sales invoice
              </Link>
              .
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">
                      <Link
                        href={tenantDashboardPath(
                          tenantSlug,
                          `/sale-returns/${r.id}`
                        )}
                        className="text-primary hover:underline"
                      >
                        {r.returnNo}
                      </Link>
                    </TableCell>
                    <TableCell>{r.sale.invoiceNo}</TableCell>
                    <TableCell>{r.customer?.name || "Walk-in"}</TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(r.refundAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell>{r.refundStatus}</TableCell>
                    <TableCell>{formatDate(r.returnDate.toISOString())}</TableCell>
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
