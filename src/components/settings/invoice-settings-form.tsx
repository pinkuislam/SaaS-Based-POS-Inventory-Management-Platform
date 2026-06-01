"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect2,
} from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { TenantInvoiceSettings } from "@/lib/tenant-settings";
import { InvoiceTemplatePreview } from "@/components/settings/invoice-template-preview";

export function InvoiceSettingsForm({
  invoice,
  businessPrefix,
  businessName,
  logoUrl,
}: {
  invoice: TenantInvoiceSettings;
  businessPrefix?: string;
  businessName: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    prefix: invoice.prefix ?? businessPrefix ?? "INV",
    numberFormat: invoice.numberFormat ?? "{prefix}-{year}-{seq}",
    footerText: invoice.footerText ?? "",
    terms: invoice.terms ?? "",
    showTax: invoice.showTax ?? true,
    showDiscount: invoice.showDiscount ?? true,
    showCustomerDue: invoice.showCustomerDue ?? true,
    showLogo: invoice.showLogo ?? true,
    defaultPrintFormat: invoice.defaultPrintFormat ?? "thermal",
    thermalLayout: invoice.thermalLayout ?? "standard",
    a4Layout: invoice.a4Layout ?? "classic",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: values,
          business: { invoicePrefix: values.prefix },
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Invoice settings saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Invoice prefix" htmlFor="inv-prefix">
            <FormInput
              id="inv-prefix"
              value={values.prefix}
              onChange={(e) =>
                setValues((v) => ({ ...v, prefix: e.target.value }))
              }
            />
          </FormField>
          <FormField label="Number format" htmlFor="inv-format">
            <FormInput
              id="inv-format"
              value={values.numberFormat}
              onChange={(e) =>
                setValues((v) => ({ ...v, numberFormat: e.target.value }))
              }
              placeholder="{prefix}-{year}-{seq}"
            />
          </FormField>
        </div>
        <p className="text-xs text-muted-foreground">
          Business logo is managed under{" "}
          <span className="font-medium">Business profile</span> and shown on
          invoices when enabled below.
        </p>
        <FormField label="Footer text" htmlFor="inv-footer">
          <FormInput
            id="inv-footer"
            value={values.footerText}
            onChange={(e) =>
              setValues((v) => ({ ...v, footerText: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Terms & conditions" htmlFor="inv-terms">
          <FormTextarea
            id="inv-terms"
            rows={3}
            value={values.terms}
            onChange={(e) => setValues((v) => ({ ...v, terms: e.target.value }))}
          />
        </FormField>
        <FormSelect2
          label="Default print format"
          htmlFor="inv-print"
          value={values.defaultPrintFormat}
          onChange={(val) =>
            setValues((prev) => ({
              ...prev,
              defaultPrintFormat: val as "thermal" | "a4",
            }))
          }
          options={[
            { value: "thermal", label: "Thermal receipt" },
            { value: "a4", label: "A4 invoice" },
          ]}
        />
        {values.defaultPrintFormat === "thermal" ? (
          <FormSelect2
            label="Thermal layout"
            value={values.thermalLayout}
            onChange={(val) =>
              setValues((v) => ({
                ...v,
                thermalLayout: val as "compact" | "standard",
              }))
            }
            options={[
              { value: "standard", label: "Standard (80mm)" },
              { value: "compact", label: "Compact (58mm)" },
            ]}
          />
        ) : (
          <FormSelect2
            label="A4 layout"
            value={values.a4Layout}
            onChange={(val) =>
              setValues((v) => ({
                ...v,
                a4Layout: val as "classic" | "modern",
              }))
            }
            options={[
              { value: "classic", label: "Classic" },
              { value: "modern", label: "Modern" },
            ]}
          />
        )}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-logo"
              checked={values.showLogo}
              onCheckedChange={(c) =>
                setValues((v) => ({ ...v, showLogo: c === true }))
              }
            />
            <Label htmlFor="show-logo">Show logo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-tax"
              checked={values.showTax}
              onCheckedChange={(c) =>
                setValues((v) => ({ ...v, showTax: c === true }))
              }
            />
            <Label htmlFor="show-tax">Show tax on invoice</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-discount"
              checked={values.showDiscount}
              onCheckedChange={(c) =>
                setValues((v) => ({ ...v, showDiscount: c === true }))
              }
            />
            <Label htmlFor="show-discount">Show discount</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-due"
              checked={values.showCustomerDue}
              onCheckedChange={(c) =>
                setValues((v) => ({ ...v, showCustomerDue: c === true }))
              }
            />
            <Label htmlFor="show-due">Show customer due</Label>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Invoice Settings"}
        </Button>
      </form>

      <InvoiceTemplatePreview
        settings={values}
        businessName={businessName}
        logoUrl={logoUrl}
      />
    </div>
  );
}
