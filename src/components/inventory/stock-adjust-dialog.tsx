"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { stockAdjustFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { ADJUSTMENT_TYPES } from "@/lib/inventory";
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
import { SlidersHorizontal } from "lucide-react";
import type { SerializedProductAdjustOption } from "@/lib/serialize";

const DIRECTION_OPTIONS = [
  { value: "add", label: "Increase stock" },
  { value: "remove", label: "Decrease stock" },
];

export function StockAdjustDialog({
  products,
}: {
  products: SerializedProductAdjustOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      productId: "",
      quantity: "",
      direction: "add",
      adjustType: "adjustment",
      reason: "",
      note: "",
    },
    stockAdjustFormSchema
  );

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (current: ${p.stockQty})`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    const qty = parseFloat(data.quantity);
    const signedQty = data.direction === "add" ? qty : -qty;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: data.productId,
          quantity: signedQty,
          type: data.adjustType,
          reason: data.reason,
          notes: data.note,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      notify.success(
        result.status === "PENDING"
          ? "Adjustment submitted for approval"
          : "Stock updated"
      );
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <SlidersHorizontal className="h-4 w-4" />
        Adjust Stock
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormSelect2
            label="Product"
            htmlFor="productId"
            required
            options={productOptions}
            value={values.productId}
            onChange={(v) => setField("productId", v)}
            placeholder="Select product"
            searchable
            error={fieldError("productId")}
          />
          <FormSelect2
            label="Adjustment type"
            htmlFor="adjustType"
            options={ADJUSTMENT_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            value={values.adjustType}
            onChange={(v) => setField("adjustType", v)}
          />
          <FormSelect2
            label="Direction"
            htmlFor="direction"
            options={DIRECTION_OPTIONS}
            value={values.direction}
            onChange={(v) => setField("direction", v)}
          />
          <FormField
            label="Quantity"
            htmlFor="quantity"
            required
            error={fieldError("quantity")}
          >
            <FormInput
              id="quantity"
              type="number"
              min="0.001"
              step="any"
              value={values.quantity}
              onChange={(e) => setField("quantity", e.target.value)}
            />
          </FormField>
          <FormField label="Reason" htmlFor="reason">
            <FormInput
              id="reason"
              value={values.reason}
              onChange={(e) => setField("reason", e.target.value)}
              placeholder="Required for corrections"
            />
          </FormField>
          <FormField label="Notes" htmlFor="note">
            <FormInput
              id="note"
              value={values.note}
              onChange={(e) => setField("note", e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Apply Adjustment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
