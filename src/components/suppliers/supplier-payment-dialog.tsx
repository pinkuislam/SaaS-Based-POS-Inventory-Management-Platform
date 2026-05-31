"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { supplierPaymentSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormSelect2,
} from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SerializedDuePurchase } from "@/lib/serialize";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "mobile", label: "Mobile" },
];

export function SupplierPaymentDialog({
  supplierId,
  supplierName,
  duePurchases,
  totalDue,
}: {
  supplierId: string;
  supplierName: string;
  duePurchases: SerializedDuePurchase[];
  totalDue: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      amount: "",
      note: "",
      method: "cash",
      purchaseId: "all",
    },
    supplierPaymentSchema
  );

  if (totalDue <= 0) return null;

  const purchaseOptions = [
    { value: "all", label: "All (oldest first)" },
    ...duePurchases.map((p) => ({
      value: p.id,
      label: `${p.invoiceNo} — ${formatCurrency(p.dueAmount)}`,
    })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          method: data.method,
          purchaseId: data.purchaseId === "all" ? null : data.purchaseId,
          notes: data.note,
        }),
      });
      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error);
      }
      notify.success("Payment recorded");
      setOpen(false);
      reset({ amount: "", note: "", method: "cash", purchaseId: "all" });
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Banknote className="h-4 w-4" />
        Pay
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Supplier — {supplierName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Total payable: {formatCurrency(totalDue)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormSelect2
            label="Purchase invoice"
            htmlFor="purchaseId"
            options={purchaseOptions}
            value={values.purchaseId}
            onChange={(v) => setField("purchaseId", v)}
            error={fieldError("purchaseId")}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Amount"
              htmlFor="amount"
              required
              error={fieldError("amount")}
            >
              <FormInput
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={values.amount}
                error={fieldError("amount")}
                onChange={(e) => setField("amount", e.target.value)}
              />
            </FormField>
            <FormSelect2
              label="Method"
              htmlFor="method"
              required
              options={PAYMENT_METHOD_OPTIONS}
              value={values.method}
              onChange={(v) => setField("method", v)}
              error={fieldError("method")}
            />
          </div>
          <FormField label="Notes" htmlFor="note" error={fieldError("note")}>
            <FormInput
              id="note"
              name="note"
              value={values.note}
              error={fieldError("note")}
              onChange={(e) => setField("note", e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
