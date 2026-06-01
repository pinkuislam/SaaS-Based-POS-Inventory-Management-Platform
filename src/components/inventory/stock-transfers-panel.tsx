"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { decimalToNumber, formatDate } from "@/lib/utils";

type Transfer = {
  id: string;
  reference: string;
  status: string;
  quantity: unknown;
  createdAt: string;
  product: { name: string };
  fromBranch: { name: string } | null;
  toBranch: { name: string };
  requestedBy: { name: string } | null;
};

export function StockTransfersPanel() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/inventory/transfers");
    setTransfers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function action(id: string, action: string) {
    const res = await fetch(`/api/inventory/transfers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify.error(data.error || "Action failed");
      return;
    }
    notify.success(`Transfer ${action}`);
    load();
    router.refresh();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading transfers...</p>;
  }

  if (transfers.length === 0) {
    return <p className="text-sm text-muted-foreground">No transfer requests yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ref</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>From → To</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-mono text-sm">{t.reference}</TableCell>
            <TableCell>{t.product.name}</TableCell>
            <TableCell className="text-sm">
              {t.fromBranch?.name || "—"} → {t.toBranch.name}
            </TableCell>
            <TableCell>{decimalToNumber(t.quantity)}</TableCell>
            <TableCell>
              <Badge variant="outline">{t.status}</Badge>
            </TableCell>
            <TableCell>{formatDate(t.createdAt)}</TableCell>
            <TableCell className="text-right space-x-1">
              {t.status === "PENDING" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => action(t.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => action(t.id, "reject")}>
                    Reject
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
