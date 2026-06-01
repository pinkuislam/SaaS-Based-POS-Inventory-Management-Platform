"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { packageSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect2,
  FormSelect2Multi,
} from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import type { SerializedSubscriptionPackage } from "@/lib/serialize";
import {
  mergeFeatureOptions,
  resolvePackageFeatureKeys,
  type PlatformFeatureOption,
} from "@/lib/admin/package-feature-options";

type PackageData = SerializedSubscriptionPackage;

const BILLING_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function buildInitial(
  pkg: PackageData | undefined,
  catalog: { key: string; name: string }[]
) {
  return {
    name: pkg?.name || "",
    description: pkg?.description || "",
    price: pkg ? String(pkg.price) : "",
    yearlyPrice: pkg?.yearlyPrice != null ? String(pkg.yearlyPrice) : "",
    billingCycle: pkg?.billingCycle || "monthly",
    trialDays: String(pkg?.trialDays ?? 14),
    graceDays: String(pkg?.graceDays ?? 7),
    maxUsers: String(pkg?.maxUsers ?? 2),
    maxBranches: String(pkg?.maxBranches ?? 1),
    maxProducts: String(pkg?.maxProducts ?? 500),
    maxInvoices: String(pkg?.maxInvoices ?? 1000),
    featureKeys: resolvePackageFeatureKeys(pkg?.features ?? [], catalog),
    isActive: pkg?.isActive ?? true,
    isPopular: pkg?.isPopular ?? false,
    sortOrder: String(pkg?.sortOrder ?? 0),
  };
}

export function PackageFormDialog({
  pkg,
  mode = "create",
  featureOptions,
  featureCatalog,
}: {
  pkg?: PackageData;
  mode?: "create" | "edit";
  featureOptions: PlatformFeatureOption[];
  featureCatalog: { key: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const catalog = featureCatalog;

  const selectOptions = useMemo(() => {
    const keys = resolvePackageFeatureKeys(pkg?.features ?? [], catalog);
    return mergeFeatureOptions(featureOptions, keys).map((o) => ({
      value: o.value,
      label: o.label,
    }));
  }, [featureOptions, pkg?.features, catalog]);

  const initial = useMemo(
    () => buildInitial(pkg, catalog),
    [pkg, catalog]
  );

  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(initial, packageSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(pkg, catalog));
    }
  }, [open, pkg, catalog, reset]);

  const nameByKey = useMemo(
    () => Object.fromEntries(catalog.map((c) => [c.key, c.name])),
    [catalog]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);

    const features = (data.featureKeys ?? []).map(
      (key) => nameByKey[key] ?? key
    );

    const payload = {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      yearlyPrice: data.yearlyPrice ? parseFloat(data.yearlyPrice) : null,
      billingCycle: data.billingCycle,
      trialDays: parseInt(data.trialDays || "14", 10),
      graceDays: parseInt(data.graceDays || "7", 10),
      maxUsers: parseInt(data.maxUsers || "2", 10),
      maxBranches: parseInt(data.maxBranches || "1", 10),
      maxProducts: parseInt(data.maxProducts || "500", 10),
      maxInvoices: parseInt(data.maxInvoices || "1000", 10),
      features,
      isActive: data.isActive ?? true,
      isPopular: data.isPopular ?? false,
      sortOrder: parseInt(data.sortOrder || "0", 10),
    };

    try {
      const url =
        mode === "edit" && pkg
          ? `/api/admin/packages/${pkg.id}`
          : "/api/admin/packages";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success(mode === "edit" ? "Package updated" : "Package created");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          mode === "edit"
            ? "inline-flex items-center gap-1 text-sm text-primary hover:underline"
            : "inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-2.5 text-sm font-medium"
        }
      >
        {mode === "edit" ? (
          <>
            <Pencil className="h-4 w-4" /> Edit
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add Package
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Package" : "Create Package"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Name" htmlFor="name" required error={fe("name")}>
            <FormInput
              id="name"
              value={form.name}
              error={fe("name")}
              onChange={(e) => setField("name", e.target.value)}
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={fe("description")}
          >
            <FormTextarea
              id="description"
              value={form.description}
              error={fe("description")}
              onChange={(e) => setField("description", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price" htmlFor="price" required error={fe("price")}>
              <FormInput
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                error={fe("price")}
                onChange={(e) => setField("price", e.target.value)}
              />
            </FormField>
            <FormField
              label="Yearly Price"
              htmlFor="yearlyPrice"
              error={fe("yearlyPrice")}
            >
              <FormInput
                id="yearlyPrice"
                type="number"
                step="0.01"
                placeholder="Optional"
                value={form.yearlyPrice}
                error={fe("yearlyPrice")}
                onChange={(e) => setField("yearlyPrice", e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect2
              label="Default Billing"
              htmlFor="billingCycle"
              required
              error={fe("billingCycle")}
              options={BILLING_OPTIONS}
              value={form.billingCycle}
              onChange={(v) => setField("billingCycle", v)}
              searchable={false}
            />
            <FormField
              label="Sort Order"
              htmlFor="sortOrder"
              error={fe("sortOrder")}
            >
              <FormInput
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                error={fe("sortOrder")}
                onChange={(e) => setField("sortOrder", e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Trial Days"
              htmlFor="trialDays"
              error={fe("trialDays")}
            >
              <FormInput
                id="trialDays"
                type="number"
                value={form.trialDays}
                error={fe("trialDays")}
                onChange={(e) => setField("trialDays", e.target.value)}
              />
            </FormField>
            <FormField
              label="Grace Days (after expiry)"
              htmlFor="graceDays"
              error={fe("graceDays")}
            >
              <FormInput
                id="graceDays"
                type="number"
                value={form.graceDays}
                error={fe("graceDays")}
                onChange={(e) => setField("graceDays", e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Max Users"
              htmlFor="maxUsers"
              error={fe("maxUsers")}
            >
              <FormInput
                id="maxUsers"
                type="number"
                value={form.maxUsers}
                error={fe("maxUsers")}
                onChange={(e) => setField("maxUsers", e.target.value)}
              />
            </FormField>
            <FormField
              label="Max Branches"
              htmlFor="maxBranches"
              error={fe("maxBranches")}
            >
              <FormInput
                id="maxBranches"
                type="number"
                value={form.maxBranches}
                error={fe("maxBranches")}
                onChange={(e) => setField("maxBranches", e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Max Products"
              htmlFor="maxProducts"
              error={fe("maxProducts")}
            >
              <FormInput
                id="maxProducts"
                type="number"
                value={form.maxProducts}
                error={fe("maxProducts")}
                onChange={(e) => setField("maxProducts", e.target.value)}
              />
            </FormField>
            <FormField
              label="Max Invoices"
              htmlFor="maxInvoices"
              error={fe("maxInvoices")}
            >
              <FormInput
                id="maxInvoices"
                type="number"
                value={form.maxInvoices}
                error={fe("maxInvoices")}
                onChange={(e) => setField("maxInvoices", e.target.value)}
              />
            </FormField>
          </div>
          <FormSelect2Multi
            label="Package Features"
            htmlFor="featureKeys"
            error={fe("featureKeys")}
            description="Select platform features included in this plan"
            options={selectOptions}
            value={form.featureKeys}
            onChange={(keys) => setField("featureKeys", keys)}
            placeholder="Select features..."
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(c) => setField("isActive", c === true)}
              />
              Active package
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isPopular}
                onCheckedChange={(c) => setField("isPopular", c === true)}
              />
              Mark as popular
            </label>
          </div>
          <SubmitButton
            loading={loading}
            loadingText={mode === "edit" ? "Updating..." : "Creating..."}
            className="w-full"
          >
            {mode === "edit" ? "Update" : "Create"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
