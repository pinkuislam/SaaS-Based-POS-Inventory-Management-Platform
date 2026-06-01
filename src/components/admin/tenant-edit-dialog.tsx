"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { tenantUpdateSchema } from "@/lib/schemas/admin-tenant";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXPIRED", label: "Expired" },
  { value: "INACTIVE", label: "Inactive" },
];

export type TenantEditData = {
  id: string;
  name: string;
  ownerName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  slug: string;
  packageId: string | null;
  status: string;
  loginBlocked: boolean;
};

function toFormValues(tenant: TenantEditData) {
  return {
    name: tenant.name,
    ownerName: tenant.ownerName || "",
    email: tenant.email,
    phone: tenant.phone || "",
    address: tenant.address || "",
    slug: tenant.slug,
    packageId: tenant.packageId || "",
    status: tenant.status as
      | "PENDING"
      | "ACTIVE"
      | "SUSPENDED"
      | "EXPIRED"
      | "INACTIVE",
    loginBlocked: tenant.loginBlocked,
  };
}

export function TenantEditDialog({
  tenant,
  packages,
  open,
  onOpenChange,
}: {
  tenant: TenantEditData;
  packages: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { values: form, setField, setValues, validate, fieldError: fe } =
    useValidatedForm(toFormValues(tenant), tenantUpdateSchema);

  useEffect(() => {
    if (open) {
      setValues(toFormValues(tenant));
    }
  }, [open, tenant, setValues]);

  const packageOptions = packages.map((p) => ({ value: p.id, label: p.name }));
  const isDemo = tenant.slug === "demo-shop";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          ownerName: data.ownerName || null,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          slug: isDemo ? undefined : data.slug,
          packageId: data.packageId || null,
          status: data.status,
          loginBlocked: data.loginBlocked,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update tenant");
      notify.success("Tenant updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to update tenant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant — {tenant.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Business Name"
              htmlFor="edit-name"
              required
              error={fe("name")}
            >
              <FormInput
                id="edit-name"
                value={form.name}
                error={fe("name")}
                onChange={(e) => setField("name", e.target.value)}
              />
            </FormField>
            <FormField
              label="Owner Name"
              htmlFor="edit-ownerName"
              error={fe("ownerName")}
            >
              <FormInput
                id="edit-ownerName"
                value={form.ownerName}
                error={fe("ownerName")}
                onChange={(e) => setField("ownerName", e.target.value)}
              />
            </FormField>
          </div>
          <FormField
            label="Slug (subdomain)"
            htmlFor="edit-slug"
            required
            error={fe("slug")}
            description={isDemo ? "Demo shop slug cannot be changed" : "e.g. my-shop"}
          >
            <FormInput
              id="edit-slug"
              value={form.slug}
              error={fe("slug")}
              disabled={isDemo}
              onChange={(e) => setField("slug", e.target.value.toLowerCase())}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Email"
              htmlFor="edit-email"
              required
              error={fe("email")}
            >
              <FormInput
                id="edit-email"
                type="email"
                value={form.email}
                error={fe("email")}
                onChange={(e) => setField("email", e.target.value)}
              />
            </FormField>
            <FormField
              label="Phone"
              htmlFor="edit-phone"
              error={fe("phone")}
            >
              <FormInput
                id="edit-phone"
                value={form.phone}
                error={fe("phone")}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </FormField>
          </div>
          <FormField
            label="Address"
            htmlFor="edit-address"
            error={fe("address")}
          >
            <FormInput
              id="edit-address"
              value={form.address}
              error={fe("address")}
              onChange={(e) => setField("address", e.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect2
              label="Package"
              options={packageOptions}
              value={form.packageId}
              onChange={(v) => setField("packageId", v)}
              placeholder="Select package"
            />
            <FormSelect2
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) =>
                setField(
                  "status",
                  v as
                    | "PENDING"
                    | "ACTIVE"
                    | "SUSPENDED"
                    | "EXPIRED"
                    | "INACTIVE"
                )
              }
              searchable={false}
              required
              error={fe("status")}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Checkbox
              id="edit-loginBlocked"
              checked={form.loginBlocked}
              onCheckedChange={(c) => setField("loginBlocked", c === true)}
            />
            <Label htmlFor="edit-loginBlocked" className="cursor-pointer font-normal">
              Block tenant login (users cannot sign in)
            </Label>
          </div>
          <SubmitButton loading={loading} className="w-full">
            Save Changes
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
