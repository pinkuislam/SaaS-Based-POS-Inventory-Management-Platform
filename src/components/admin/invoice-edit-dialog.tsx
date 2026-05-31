"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { invoiceEditSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea, FormSelect2 } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "overdue", label: "Overdue" },
];

type Invoice = {
  id: string;
  status: string;
  notes: string | null;
};

function buildInitial(invoice?: Invoice) {
  return {
    status: invoice?.status || "unpaid",
    notes: invoice?.notes || "",
  };
}

export function InvoiceEditDialog({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(invoice), invoiceEditSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(invoice));
    }
  }, [open, invoice, reset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: data.status,
          notes: data.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Invoice updated");
      setOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormSelect2
            label="Status"
            htmlFor="status"
            required
            error={fe("status")}
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(v) => setField("status", v)}
            searchable={false}
          />
          <FormField label="Notes" htmlFor="notes" error={fe("notes")}>
            <FormTextarea
              id="notes"
              rows={4}
              value={form.notes}
              error={fe("notes")}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
