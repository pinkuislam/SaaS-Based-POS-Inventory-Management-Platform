"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { couponSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
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
import { Plus, Pencil } from "lucide-react";
import type { SerializedCoupon } from "@/lib/serialize";

const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed" },
];

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: unknown;
  expiryDate: Date | string | null;
  usageLimit: number | null;
  packageId: string | null;
};

function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}

function buildInitial(coupon?: SerializedCoupon) {
  return {
    code: coupon?.code || "",
    discountType: (coupon?.discountType || "percentage") as
      | "percentage"
      | "fixed",
    discountValue: coupon?.discountValue != null ? String(coupon.discountValue) : "10",
    expiryDate: toDateInput(coupon?.expiryDate),
    usageLimit: coupon?.usageLimit != null ? String(coupon.usageLimit) : "",
    packageId: coupon?.packageId || "",
  };
}

export function CouponFormDialog({
  packages,
  coupon,
  mode = "create",
}: {
  packages: { id: string; name: string }[];
  coupon?: SerializedCoupon;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(coupon), couponSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(coupon));
    }
  }, [open, coupon, reset]);

  const packageOptions = [
    { value: "", label: "All packages" },
    ...packages.map((p) => ({ value: p.id, label: p.name })),
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const payload = {
      code: data.code,
      discountType: data.discountType,
      discountValue: parseFloat(data.discountValue),
      expiryDate: data.expiryDate || null,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
      packageId: data.packageId || null,
    };
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/coupons"
          : `/api/admin/coupons/${coupon!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      notify.success(mode === "create" ? "Coupon created" : "Coupon updated");
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
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Coupon" : "Edit Coupon"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            label="Code"
            htmlFor="code"
            required
            error={fe("code")}
          >
            <FormInput
              id="code"
              value={form.code}
              error={fe("code")}
              onChange={(e) => setField("code", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect2
              label="Type"
              htmlFor="discountType"
              required
              error={fe("discountType")}
              options={DISCOUNT_TYPE_OPTIONS}
              value={form.discountType}
              onChange={(v) =>
                setField("discountType", v as "percentage" | "fixed")
              }
              searchable={false}
            />
            <FormField
              label="Value"
              htmlFor="discountValue"
              required
              error={fe("discountValue")}
            >
              <FormInput
                id="discountValue"
                type="number"
                value={form.discountValue}
                error={fe("discountValue")}
                onChange={(e) => setField("discountValue", e.target.value)}
              />
            </FormField>
          </div>
          <FormSelect2
            label="Package (optional)"
            htmlFor="packageId"
            error={fe("packageId")}
            options={packageOptions}
            value={form.packageId}
            onChange={(v) => setField("packageId", v)}
            placeholder="All packages"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Expiry" htmlFor="expiryDate" error={fe("expiryDate")}>
              <FormInput
                id="expiryDate"
                type="date"
                value={form.expiryDate}
                error={fe("expiryDate")}
                onChange={(e) => setField("expiryDate", e.target.value)}
              />
            </FormField>
            <FormField
              label="Usage Limit"
              htmlFor="usageLimit"
              error={fe("usageLimit")}
            >
              <FormInput
                id="usageLimit"
                type="number"
                value={form.usageLimit}
                error={fe("usageLimit")}
                onChange={(e) => setField("usageLimit", e.target.value)}
              />
            </FormField>
          </div>
          <SubmitButton loading={loading} className="w-full">
            Save
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
