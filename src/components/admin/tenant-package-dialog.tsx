"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { tenantPackageSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormSelect2 } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package } from "lucide-react";

export function TenantPackageDialog({
  tenantId,
  tenantName,
  currentPackageId,
  packages,
}: {
  tenantId: string;
  tenantName: string;
  currentPackageId: string | null;
  packages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    { packageId: currentPackageId || "" },
    tenantPackageSchema
  );

  const packageOptions = packages.map((p) => ({ value: p.id, label: p.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/package`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: data.packageId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Package updated");
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
      <DialogTrigger className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        <Package className="h-3 w-3" /> Change
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Package — {tenantName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormSelect2
            label="Subscription Package"
            htmlFor="packageId"
            required
            error={fe("packageId")}
            options={packageOptions}
            value={form.packageId}
            onChange={(v) => setField("packageId", v)}
            placeholder="Select package"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Update Package"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
