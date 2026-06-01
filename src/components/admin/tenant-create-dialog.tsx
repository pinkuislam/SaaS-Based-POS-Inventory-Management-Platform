"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { tenantCreateSchema } from "@/lib/schemas/admin-tenant";
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

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function TenantCreateDialog({
  packages,
}: {
  packages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(
      {
        name: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
        slug: "",
        packageId: "",
        status: "PENDING",
        adminPassword: "password123",
      },
      tenantCreateSchema
    );

  const packageOptions = packages.map((p) => ({ value: p.id, label: p.name }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          packageId: data.packageId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create tenant");
      notify.success("Tenant created successfully");
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Add Tenant
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Business Name"
              htmlFor="name"
              required
              error={fe("name")}
            >
              <FormInput
                id="name"
                name="name"
                value={form.name}
                error={fe("name")}
                onChange={(e) => setField("name", e.target.value)}
              />
            </FormField>
            <FormField
              label="Owner Name"
              htmlFor="ownerName"
              error={fe("ownerName")}
            >
              <FormInput
                id="ownerName"
                name="ownerName"
                value={form.ownerName}
                error={fe("ownerName")}
                onChange={(e) => setField("ownerName", e.target.value)}
              />
            </FormField>
          </div>
          <FormField
            label="Slug (subdomain)"
            htmlFor="slug"
            required
            error={fe("slug")}
            description="e.g. my-shop"
          >
            <FormInput
              id="slug"
              name="slug"
              placeholder="my-shop"
              value={form.slug}
              error={fe("slug")}
              onChange={(e) => setField("slug", e.target.value.toLowerCase())}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Email"
              htmlFor="email"
              required
              error={fe("email")}
            >
              <FormInput
                id="email"
                name="email"
                type="email"
                value={form.email}
                error={fe("email")}
                onChange={(e) => setField("email", e.target.value)}
              />
            </FormField>
            <FormField
              label="Phone"
              htmlFor="phone"
              error={fe("phone")}
            >
              <FormInput
                id="phone"
                name="phone"
                value={form.phone}
                error={fe("phone")}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </FormField>
          </div>
          <FormField
            label="Address"
            htmlFor="address"
            error={fe("address")}
          >
            <FormInput
              id="address"
              name="address"
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
              onChange={(v) => setField("status", v)}
              searchable={false}
              required
              error={fe("status")}
            />
          </div>
          <FormField
            label="Admin Password"
            htmlFor="adminPassword"
            required
            error={fe("adminPassword")}
          >
            <FormInput
              id="adminPassword"
              name="adminPassword"
              type="password"
              value={form.adminPassword}
              error={fe("adminPassword")}
              onChange={(e) => setField("adminPassword", e.target.value)}
            />
          </FormField>
          <SubmitButton loading={loading} loadingText="Creating..." className="w-full">
            Create Tenant
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
