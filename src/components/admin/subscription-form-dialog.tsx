"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { subscriptionSchema } from "@/lib/schemas/forms";
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
import type { SerializedSubscription } from "@/lib/serialize";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "TRIAL", label: "Trial" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

function buildInitial(sub?: SerializedSubscription) {
  return {
    tenantId: sub?.tenantId || "",
    packageId: sub?.packageId || "",
    endDate: toDateInput(sub?.endDate),
    status: sub?.status || "ACTIVE",
    startDate: toDateInput(sub?.startDate),
    amount: sub?.amount != null ? String(sub.amount) : "",
  };
}

export function SubscriptionFormDialog({
  tenants,
  packages,
  subscription,
  mode = "create",
}: {
  tenants: { id: string; name: string }[];
  packages: { id: string; name: string }[];
  subscription?: SerializedSubscription;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(subscription), subscriptionSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(subscription));
    }
  }, [open, subscription, reset]);

  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.name }));
  const packageOptions = packages.map((p) => ({ value: p.id, label: p.name }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const payload = {
      tenantId: data.tenantId,
      packageId: data.packageId,
      status: data.status,
      startDate: data.startDate || undefined,
      endDate: data.endDate,
      amount: data.amount ? parseFloat(data.amount) : undefined,
    };
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/subscriptions"
          : `/api/admin/subscriptions/${subscription!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      notify.success(
        mode === "create" ? "Subscription created" : "Subscription updated"
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
          Assign Subscription
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Subscription" : "Edit Subscription"}
          </DialogTitle>
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
            disabled={mode === "edit"}
          />
          <FormSelect2
            label="Package"
            htmlFor="packageId"
            required
            error={fe("packageId")}
            options={packageOptions}
            value={form.packageId}
            onChange={(v) => setField("packageId", v)}
            placeholder="Select package"
          />
          {mode === "edit" && (
            <FormField
              label="Start Date"
              htmlFor="startDate"
              error={fe("startDate")}
            >
              <FormInput
                id="startDate"
                type="date"
                value={form.startDate}
                error={fe("startDate")}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </FormField>
          )}
          <FormField
            label="End Date"
            htmlFor="endDate"
            required
            error={fe("endDate")}
          >
            <FormInput
              id="endDate"
              type="date"
              value={form.endDate}
              error={fe("endDate")}
              onChange={(e) => setField("endDate", e.target.value)}
            />
          </FormField>
          <FormField label="Amount" htmlFor="amount" error={fe("amount")}>
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
