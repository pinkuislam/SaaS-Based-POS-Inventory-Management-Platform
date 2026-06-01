"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function PurchasePaymentForm({
  purchaseId,
  dueAmount,
  paidAmount,
}: {
  purchaseId: string;
  dueAmount: number;
  paidAmount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(String(dueAmount));

  if (dueAmount <= 0) return null;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const pay = parseFloat(amount);
    if (Number.isNaN(pay) || pay <= 0) {
      notify.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: paidAmount + pay }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Payment recorded");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Due: {formatCurrency(dueAmount)}
        </p>
        <form onSubmit={handlePay} className="flex gap-2 items-end">
          <div className="flex-1">
            <FormInput
              id="pay-amt"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-auto">
            {loading ? "..." : "Pay"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
