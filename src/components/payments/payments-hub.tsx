"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
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
import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";

type DueData = {
  customerDues: { customerId: string; name: string; phone: string | null; totalDue: number }[];
  dueSales: { id: string; invoiceNo: string; dueAmount: unknown; saleDate: string; customer?: { name: string } | null }[];
  duePurchases: { id: string; invoiceNo: string; dueAmount: unknown; purchaseDate: string; supplier?: { name: string } | null }[];
  totalCustomerDue: number;
  totalSupplierDue: number;
};

export function PaymentsHub() {
  const [data, setData] = useState<DueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/due")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading payments...</p>;
  }

  if (!data) {
    return <p className="text-sm text-destructive">Failed to load payment data.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Customer Due"
          value={formatCurrency(data.totalCustomerDue)}
          icon={ArrowDownLeft}
          description="Amount to collect"
        />
        <StatCard
          title="Supplier Due"
          value={formatCurrency(data.totalSupplierDue)}
          icon={ArrowUpRight}
          description="Amount to pay"
        />
        <StatCard
          title="Net Position"
          value={formatCurrency(data.totalCustomerDue - data.totalSupplierDue)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Due Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {data.customerDues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customer dues</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.customerDues.map((c) => (
                    <TableRow key={c.customerId}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.phone || "—"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.totalDue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {data.dueSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No due sales</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dueSales.slice(0, 15).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.invoiceNo}</TableCell>
                      <TableCell>{s.customer?.name || "Walk-in"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(decimalToNumber(s.dueAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Due Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {data.duePurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No supplier dues</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.duePurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.invoiceNo}</TableCell>
                      <TableCell>{p.supplier?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Due</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(decimalToNumber(p.dueAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
