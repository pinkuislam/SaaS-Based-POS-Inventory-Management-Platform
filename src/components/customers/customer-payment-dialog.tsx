"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { customerPaymentSchema } from "@/lib/schemas/forms";
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
import type { SerializedDueSale } from "@/lib/serialize";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile Banking" },
  { value: "bank", label: "Bank Transfer" },
];

export function CustomerPaymentDialog({
  customerId,
  customerName,
  dueSales,
  totalDue,
}: {
  customerId: string;
  customerName: string;
  dueSales: SerializedDueSale[];
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
      saleId: "all",
    },
    customerPaymentSchema
  );

  if (totalDue <= 0) return null;

  const saleOptions = [
    { value: "all", label: "All invoices (oldest first)" },
    ...dueSales.map((s) => ({
      value: s.id,
      label: `${s.invoiceNo} — due ${formatCurrency(s.dueAmount)}`,
    })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          method: data.method,
          saleId: data.saleId === "all" ? null : data.saleId,
          notes: data.note,
        }),
      });
      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error);
      }
      notify.success("Payment recorded");
      setOpen(false);
      reset({ amount: "", note: "", method: "cash", saleId: "all" });
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
        Collect
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Payment — {customerName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Total due: {formatCurrency(totalDue)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormSelect2
            label="Apply to invoice"
            htmlFor="saleId"
            options={saleOptions}
            value={values.saleId}
            onChange={(v) => setField("saleId", v)}
            error={fieldError("saleId")}
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
                min="0"
                value={values.amount}
                error={fieldError("amount")}
                onChange={(e) => setField("amount", e.target.value)}
                placeholder={String(totalDue)}
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
