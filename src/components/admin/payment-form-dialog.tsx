"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { subscriptionPaymentSchema } from "@/lib/schemas/forms";
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
import { Plus, Pencil } from "lucide-react";
import type { SerializedSubscriptionPayment } from "@/lib/serialize";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const METHOD_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "stripe", label: "Stripe" },
  { value: "sslcommerz", label: "SSLCommerz" },
  { value: "bank", label: "Bank Transfer" },
];

function buildInitial(payment?: SerializedSubscriptionPayment) {
  return {
    subscriptionId: payment?.subscriptionId || "",
    amount: payment?.amount != null ? String(payment.amount) : "",
    method: payment?.method || "manual",
    transactionId: payment?.transactionId || "",
    status: payment?.status || "PAID",
  };
}

export function PaymentFormDialog({
  subscriptions,
  payment,
  mode = "create",
}: {
  subscriptions: { id: string; label: string }[];
  payment?: SerializedSubscriptionPayment;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(payment), subscriptionPaymentSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(payment));
    }
  }, [open, payment, reset]);

  const subscriptionOptions = subscriptions.map((s) => ({
    value: s.id,
    label: s.label,
  }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const payload = {
      subscriptionId: data.subscriptionId,
      amount: parseFloat(data.amount),
      method: data.method || "manual",
      transactionId: data.transactionId || null,
      status: data.status,
    };
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/payments"
          : `/api/admin/payments/${payment!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(typeof d.error === "string" ? d.error : "Failed");
      }
      notify.success(
        mode === "create" ? "Payment recorded" : "Payment updated"
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Record Payment" : "Edit Payment"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormSelect2
            label="Subscription"
            htmlFor="subscriptionId"
            required
            error={fe("subscriptionId")}
            options={subscriptionOptions}
            value={form.subscriptionId}
            onChange={(v) => setField("subscriptionId", v)}
            placeholder="Select subscription"
            disabled={mode === "edit"}
          />
          <FormField
            label="Amount"
            htmlFor="amount"
            required
            error={fe("amount")}
          >
            <FormInput
              id="amount"
              type="number"
              step="0.01"
              value={form.amount}
              error={fe("amount")}
              onChange={(e) => setField("amount", e.target.value)}
            />
          </FormField>
          <FormSelect2
            label="Method"
            htmlFor="method"
            error={fe("method")}
            options={METHOD_OPTIONS}
            value={form.method}
            onChange={(v) => setField("method", v)}
            searchable={false}
          />
          <FormField
            label="Transaction ID"
            htmlFor="transactionId"
            error={fe("transactionId")}
          >
            <FormInput
              id="transactionId"
              value={form.transactionId}
              error={fe("transactionId")}
              onChange={(e) => setField("transactionId", e.target.value)}
            />
          </FormField>
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
          <SubmitButton loading={loading} className="w-full">
            Save
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
