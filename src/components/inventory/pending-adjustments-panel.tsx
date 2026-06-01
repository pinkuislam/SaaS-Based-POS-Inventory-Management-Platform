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

type Movement = {
  id: string;
  type: string;
  quantity: unknown;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  product: { name: string };
};

export function PendingAdjustmentsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<Movement[]>([]);

  async function load() {
    const res = await fetch("/api/inventory/movements?status=PENDING&limit=20");
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    const res = await fetch(`/api/inventory/movements/${id}/approve`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      notify.error(data.error || "Approve failed");
      return;
    }
    notify.success("Adjustment approved");
    load();
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending adjustments.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{m.product.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{m.type}</Badge>
            </TableCell>
            <TableCell>{decimalToNumber(m.quantity)}</TableCell>
            <TableCell className="text-sm">{m.reason || m.notes || "—"}</TableCell>
            <TableCell>{formatDate(m.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => approve(m.id)}>
                Approve
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
