"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { tenantProfileFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormTextarea,
} from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function TenantProfileForm({
  tenant,
  settings,
}: {
  tenant: {
    name: string;
    phone: string | null;
    address: string | null;
  };
  settings: {
    pos?: { defaultTaxRate?: number; receiptFooter?: string };
    loyalty?: {
      enabled?: boolean;
      spendPerPoint?: number;
      valuePerPoint?: number;
    };
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      name: tenant.name,
      phone: tenant.phone || "",
      address: tenant.address || "",
      defaultTaxRate: String(settings.pos?.defaultTaxRate ?? 0),
      receiptFooter: settings.pos?.receiptFooter || "Thank you for your business!",
      loyaltyEnabled: settings.loyalty?.enabled ?? false,
      spendPerPoint: String(settings.loyalty?.spendPerPoint ?? 100),
      valuePerPoint: String(settings.loyalty?.valuePerPoint ?? 1),
    },
    tenantProfileFormSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tenant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: data.address,
          settings: {
            pos: {
              defaultTaxRate: parseFloat(data.defaultTaxRate || "0") || 0,
              receiptFooter: data.receiptFooter,
            },
            loyalty: {
              enabled: data.loyaltyEnabled,
              spendPerPoint: parseFloat(data.spendPerPoint || "100") || 100,
              valuePerPoint: parseFloat(data.valuePerPoint || "1") || 1,
            },
          },
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Profile updated");
      router.refresh();
    } catch {
      notify.error("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="Business Name"
        htmlFor="name"
        required
        error={fieldError("name")}
      >
        <FormInput
          id="name"
          name="name"
          value={values.name}
          error={fieldError("name")}
          onChange={(e) => setField("name", e.target.value)}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Phone" htmlFor="phone" error={fieldError("phone")}>
          <FormInput
            id="phone"
            name="phone"
            value={values.phone}
            error={fieldError("phone")}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </FormField>
        <FormField
          label="Default Tax % (POS)"
          htmlFor="defaultTaxRate"
          error={fieldError("defaultTaxRate")}
        >
          <FormInput
            id="defaultTaxRate"
            name="defaultTaxRate"
            type="number"
            step="0.01"
            value={values.defaultTaxRate}
            error={fieldError("defaultTaxRate")}
            onChange={(e) => setField("defaultTaxRate", e.target.value)}
          />
        </FormField>
      </div>
      <FormField
        label="Address"
        htmlFor="address"
        error={fieldError("address")}
      >
        <FormTextarea
          id="address"
          name="address"
          value={values.address}
          error={fieldError("address")}
          onChange={(e) => setField("address", e.target.value)}
          rows={2}
        />
      </FormField>
      <FormField
        label="Receipt Footer"
        htmlFor="receiptFooter"
        error={fieldError("receiptFooter")}
      >
        <FormInput
          id="receiptFooter"
          name="receiptFooter"
          value={values.receiptFooter}
          error={fieldError("receiptFooter")}
          onChange={(e) => setField("receiptFooter", e.target.value)}
        />
      </FormField>
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="loyaltyEnabled"
            checked={values.loyaltyEnabled}
            onCheckedChange={(c) => setField("loyaltyEnabled", c === true)}
          />
          <Label htmlFor="loyaltyEnabled">Enable loyalty points</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Spend per 1 point (৳)"
            htmlFor="spendPerPoint"
            error={fieldError("spendPerPoint")}
          >
            <FormInput
              id="spendPerPoint"
              name="spendPerPoint"
              type="number"
              value={values.spendPerPoint}
              error={fieldError("spendPerPoint")}
              onChange={(e) => setField("spendPerPoint", e.target.value)}
            />
          </FormField>
          <FormField
            label="Redeem value per point (৳)"
            htmlFor="valuePerPoint"
            error={fieldError("valuePerPoint")}
          >
            <FormInput
              id="valuePerPoint"
              name="valuePerPoint"
              type="number"
              step="0.01"
              value={values.valuePerPoint}
              error={fieldError("valuePerPoint")}
              onChange={(e) => setField("valuePerPoint", e.target.value)}
            />
          </FormField>
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Profile & POS Settings"}
      </Button>
    </form>
  );
}
