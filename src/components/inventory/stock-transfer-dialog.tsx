"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { stockTransferFormSchema } from "@/lib/schemas/forms";
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
import { ArrowLeftRight } from "lucide-react";
import type { SerializedProductStockOption } from "@/lib/serialize";

interface BranchOption {
  id: string;
  name: string;
}

export function StockTransferDialog({
  products,
  branches,
}: {
  products: SerializedProductStockOption[];
  branches: BranchOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      productId: "",
      fromBranchId: "",
      toBranchId: "",
      quantity: "",
      note: "",
    },
    stockTransferFormSchema
  );

  if (branches.length < 2) return null;

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (stock: ${p.stockQty})`,
  }));

  const fromBranchOptions = [
    { value: "", label: "Product's branch" },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  const toBranchOptions = branches.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: data.productId,
          fromBranchId: data.fromBranchId || null,
          toBranchId: data.toBranchId,
          quantity: parseFloat(data.quantity),
          notes: data.note,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success(
        `Transfer request created (${resData.reference}). Approve from inventory.`
      );
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ArrowLeftRight className="h-4 w-4" />
        Transfer Stock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Branch Stock Transfer</DialogTitle>
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
            label="From branch"
            htmlFor="fromBranchId"
            options={fromBranchOptions}
            value={values.fromBranchId}
            onChange={(v) => setField("fromBranchId", v)}
            placeholder="Current / any"
            error={fieldError("fromBranchId")}
          />
          <FormSelect2
            label="To branch"
            htmlFor="toBranchId"
            required
            options={toBranchOptions}
            value={values.toBranchId}
            onChange={(v) => setField("toBranchId", v)}
            placeholder="Destination"
            error={fieldError("toBranchId")}
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
            {loading ? "Transferring..." : "Transfer Stock"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
