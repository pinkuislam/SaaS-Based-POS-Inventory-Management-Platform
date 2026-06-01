"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { useSession } from "@/lib/auth-client";
import { formatCurrency, decimalToNumber, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SaleRow = {
  id: string;
  invoiceNo: string;
  total: unknown;
  status: string;
  paymentStatus: string;
  saleDate: string;
  user?: { name: string } | null;
  branch?: { name: string } | null;
};

export function PosSalesBrowser() {
  const { data: session } = useSession();
  const tenantSlug = session?.user?.tenantSlug || "";
  const [sales, setSales] = useState<SaleRow[]>([]);

  useEffect(() => {
    fetch("/api/sales?pos=1&limit=50")
      .then((r) => r.json())
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const today = sales.filter((s) => {
    const d = new Date(s.saleDate);
    const n = new Date();
    return (
      d.getDate() === n.getDate() &&
      d.getMonth() === n.getMonth() &&
      d.getFullYear() === n.getFullYear()
    );
  });
  const held = sales.filter((s) => s.status === "HELD");
  const completed = sales.filter((s) => s.status === "COMPLETED");
  const due = sales.filter(
    (s) => s.paymentStatus === "DUE" || s.paymentStatus === "PARTIAL"
  );

  function list(rows: SaleRow[]) {
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No sales in this view.
        </p>
      );
    }
    return (
      <div className="max-h-40 overflow-y-auto divide-y text-sm">
        {rows.slice(0, 15).map((s) => (
          <Link
            key={s.id}
            href={tenantDashboardPath(tenantSlug, `/sales/${s.id}`)}
            className="flex items-center justify-between gap-2 py-2 hover:bg-muted/50 px-1 rounded"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs">{s.invoiceNo}</p>
              <p className="text-xs text-muted-foreground truncate">
                {s.user?.name || "—"}
                {s.branch?.name ? ` · ${s.branch.name}` : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-medium">
                {formatCurrency(decimalToNumber(s.total))}
              </p>
              <Badge variant="outline" className="text-[10px]">
                {s.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="today" className="rounded-lg border bg-card p-3">
      <TabsList className="w-full justify-start h-8">
        <TabsTrigger value="today" className="text-xs">
          Today ({today.length})
        </TabsTrigger>
        <TabsTrigger value="held" className="text-xs">
          Held ({held.length})
        </TabsTrigger>
        <TabsTrigger value="completed" className="text-xs">
          Completed
        </TabsTrigger>
        <TabsTrigger value="due" className="text-xs">
          Due ({due.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="today" className="mt-2">
        {list(today)}
      </TabsContent>
      <TabsContent value="held" className="mt-2">
        {list(held)}
      </TabsContent>
      <TabsContent value="completed" className="mt-2">
        {list(completed)}
      </TabsContent>
      <TabsContent value="due" className="mt-2">
        {list(due)}
      </TabsContent>
      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
        <Link
          href={tenantDashboardPath(tenantSlug, "/sales")}
          className="text-primary hover:underline"
        >
          View all sales →
        </Link>
      </p>
    </Tabs>
  );
}
