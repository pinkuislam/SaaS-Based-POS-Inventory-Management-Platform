"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { stockAdjustFormSchema } from "@/lib/schemas/forms";
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
import { SlidersHorizontal } from "lucide-react";
import type { SerializedProductAdjustOption } from "@/lib/serialize";

const ADJUSTMENT_TYPE_OPTIONS = [
  { value: "add", label: "Add Stock" },
  { value: "remove", label: "Remove Stock" },
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
      type: "add",
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
    const signedQty = data.type === "add" ? qty : -qty;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: data.productId,
          quantity: signedQty,
          type: data.type === "remove" ? "damage" : "adjustment",
          notes: data.note,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Stock updated");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      notify.error("Failed to adjust stock");
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
      <DialogContent>
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
            label="Type"
            htmlFor="type"
            required
            options={ADJUSTMENT_TYPE_OPTIONS}
            value={values.type}
            onChange={(v) => setField("type", v)}
            error={fieldError("type")}
          />
          <FormField
            label="Quantity"
            htmlFor="quantity"
            required
            error={fieldError("quantity")}
          >
            <FormInput
              id="quantity"
              name="quantity"
              type="number"
              min="0.001"
              step="any"
              value={values.quantity}
              error={fieldError("quantity")}
              onChange={(e) => setField("quantity", e.target.value)}
            />
          </FormField>
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
            {loading ? "Saving..." : "Apply Adjustment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
