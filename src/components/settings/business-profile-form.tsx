"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { businessProfileSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect2,
} from "@/components/ui/form-field";
import { BusinessLogoUpload } from "@/components/settings/business-logo-upload";
import {
  BUSINESS_TYPES,
  CURRENCIES,
  TIMEZONES,
} from "@/lib/constants/business";
import type { BusinessProfileData } from "@/lib/business-profile";

export function BusinessProfileForm({ profile }: { profile: BusinessProfileData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      name: profile.name,
      ownerName: profile.ownerName || "",
      email: profile.email,
      phone: profile.phone || "",
      address: profile.address || "",
      taxVatNumber: profile.business.taxVatNumber,
      businessType: profile.business.businessType,
      invoicePrefix: profile.business.invoicePrefix,
      currency: profile.business.currency,
      timezone: profile.business.timezone,
    },
    businessProfileSchema
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
          ownerName: data.ownerName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          business: {
            taxVatNumber: data.taxVatNumber,
            businessType: data.businessType,
            invoicePrefix: data.invoicePrefix,
            currency: data.currency,
            timezone: data.timezone,
          },
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Business profile saved");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <h3 className="text-sm font-medium mb-3">Business logo</h3>
        <BusinessLogoUpload logo={profile.logo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Business name"
          htmlFor="bp-name"
          required
          error={fieldError("name")}
          className="sm:col-span-2"
        >
          <FormInput
            id="bp-name"
            value={values.name}
            error={fieldError("name")}
            onChange={(e) => setField("name", e.target.value)}
          />
        </FormField>
        <FormField
          label="Owner name"
          htmlFor="bp-owner"
          required
          error={fieldError("ownerName")}
        >
          <FormInput
            id="bp-owner"
            value={values.ownerName}
            error={fieldError("ownerName")}
            onChange={(e) => setField("ownerName", e.target.value)}
          />
        </FormField>
        <FormField
          label="Business type"
          htmlFor="bp-type"
          required
          error={fieldError("businessType")}
        >
          <FormSelect2
            value={values.businessType}
            onChange={(v) => setField("businessType", v)}
            options={[...BUSINESS_TYPES]}
          />
        </FormField>
        <FormField
          label="Business email"
          htmlFor="bp-email"
          required
          error={fieldError("email")}
        >
          <FormInput
            id="bp-email"
            type="email"
            value={values.email}
            error={fieldError("email")}
            onChange={(e) => setField("email", e.target.value)}
          />
        </FormField>
        <FormField label="Phone" htmlFor="bp-phone" error={fieldError("phone")}>
          <FormInput
            id="bp-phone"
            value={values.phone}
            error={fieldError("phone")}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </FormField>
        <FormField
          label="Tax / VAT registration no."
          htmlFor="bp-vat"
          error={fieldError("taxVatNumber")}
        >
          <FormInput
            id="bp-vat"
            value={values.taxVatNumber}
            error={fieldError("taxVatNumber")}
            onChange={(e) => setField("taxVatNumber", e.target.value)}
            placeholder="e.g. 123456789"
          />
        </FormField>
        <FormField
          label="Address"
          htmlFor="bp-address"
          error={fieldError("address")}
          className="sm:col-span-2"
        >
          <FormTextarea
            id="bp-address"
            value={values.address}
            error={fieldError("address")}
            onChange={(e) => setField("address", e.target.value)}
            rows={3}
          />
        </FormField>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-medium mb-4">Regional & invoicing defaults</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Default currency"
            required
            error={fieldError("currency")}
          >
            <FormSelect2
              value={values.currency}
              onChange={(v) => setField("currency", v)}
              options={[...CURRENCIES]}
            />
          </FormField>
          <FormField
            label="Default timezone"
            required
            error={fieldError("timezone")}
          >
            <FormSelect2
              value={values.timezone}
              onChange={(v) => setField("timezone", v)}
              options={[...TIMEZONES]}
            />
          </FormField>
          <FormField
            label="Invoice prefix"
            htmlFor="bp-prefix"
            required
            error={fieldError("invoicePrefix")}
          >
            <FormInput
              id="bp-prefix"
              value={values.invoicePrefix}
              error={fieldError("invoicePrefix")}
              onChange={(e) => setField("invoicePrefix", e.target.value)}
              placeholder="INV"
              className="font-mono"
            />
          </FormField>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save business profile"}
      </Button>
    </form>
  );
}
