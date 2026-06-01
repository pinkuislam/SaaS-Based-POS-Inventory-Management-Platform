"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { invoiceSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const initial = {
  tenantId: "",
  amount: "",
  tax: "0",
  discount: "0",
  dueDate: "",
  notes: "",
};

export function InvoiceFormDialog({
  tenants,
}: {
  tenants: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(initial, invoiceSchema);

  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.name }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: data.tenantId,
          amount: parseFloat(data.amount),
          tax: parseFloat(data.tax || "0"),
          discount: parseFloat(data.discount || "0"),
          dueDate: data.dueDate || null,
          notes: data.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Invoice created");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      notify.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Generate Invoice
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormSelect2
            label="Tenant"
            htmlFor="tenantId"
            required
            error={fe("tenantId")}
            options={tenantOptions}
            value={form.tenantId}
            onChange={(v) => setField("tenantId", v)}
            placeholder="Select tenant"
          />
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="Amount"
              htmlFor="amount"
              required
              error={fe("amount")}
            >
              <FormInput
                id="amount"
                type="number"
                value={form.amount}
                error={fe("amount")}
                onChange={(e) => setField("amount", e.target.value)}
              />
            </FormField>
            <FormField label="Tax" htmlFor="tax" error={fe("tax")}>
              <FormInput
                id="tax"
                type="number"
                value={form.tax}
                error={fe("tax")}
                onChange={(e) => setField("tax", e.target.value)}
              />
            </FormField>
            <FormField label="Discount" htmlFor="discount" error={fe("discount")}>
              <FormInput
                id="discount"
                type="number"
                value={form.discount}
                error={fe("discount")}
                onChange={(e) => setField("discount", e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Due Date" htmlFor="dueDate" error={fe("dueDate")}>
            <FormInput
              id="dueDate"
              type="date"
              value={form.dueDate}
              error={fe("dueDate")}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
          </FormField>
          <SubmitButton loading={loading} loadingText="Creating..." className="w-full">
            Create
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
