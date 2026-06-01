"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { TenantTaxRate } from "@/lib/tenant-settings";
import { tenantDashboardPath } from "@/lib/tenant-path";

export function TaxSettingsManager({
  initialTaxes,
  tenantSlug,
}: {
  initialTaxes: TenantTaxRate[];
  tenantSlug: string;
}) {
  const router = useRouter();
  const [taxes, setTaxes] = useState<TenantTaxRate[]>(initialTaxes);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    rate: "",
    type: "percentage",
  });
  const [editDraft, setEditDraft] = useState({
    name: "",
    rate: "",
    type: "percentage",
  });

  useEffect(() => {
    setTaxes(initialTaxes);
  }, [initialTaxes]);

  async function saveAll(updated: TenantTaxRate[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxes: updated }),
      });
      if (!res.ok) throw new Error();
      setTaxes(updated);
      notify.success("Tax settings saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.rate) return;
    const rate = parseFloat(draft.rate);
    if (Number.isNaN(rate) || rate < 0) {
      notify.error("Invalid rate");
      return;
    }
    const next: TenantTaxRate[] = [
      ...taxes,
      {
        id: crypto.randomUUID(),
        name: draft.name.trim(),
        rate,
        type: draft.type,
        isActive: true,
      },
    ];
    setDraft({ name: "", rate: "", type: "percentage" });
    saveAll(next);
  }

  async function handleRemove(tax: TenantTaxRate) {
    try {
      const res = await fetch(
        `/api/tenant/taxes/usage?id=${encodeURIComponent(tax.id)}&rate=${tax.rate}`
      );
      const usage = await res.json();
      if (usage.inUse) {
        const ok = await confirmDelete(
          `${usage.message} Remove "${tax.name}" anyway?`
        );
        if (!ok) return;
      } else {
        const ok = await confirmDelete(`Remove tax "${tax.name}"?`);
        if (!ok) return;
      }
    } catch {
      const ok = await confirmDelete(`Remove tax "${tax.name}"?`);
      if (!ok) return;
    }
    saveAll(taxes.filter((t) => t.id !== tax.id));
  }

  function toggleActive(id: string) {
    saveAll(
      taxes.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  }

  function startEdit(tax: TenantTaxRate) {
    setEditingId(tax.id);
    setEditDraft({
      name: tax.name,
      rate: String(tax.rate),
      type: tax.type,
    });
  }

  function saveEdit(id: string) {
    const rate = parseFloat(editDraft.rate);
    if (!editDraft.name.trim() || Number.isNaN(rate) || rate < 0) {
      notify.error("Invalid tax");
      return;
    }
    saveAll(
      taxes.map((t) =>
        t.id === id
          ? {
              ...t,
              name: editDraft.name.trim(),
              rate,
              type: editDraft.type,
            }
          : t
      )
    );
    setEditingId(null);
  }

  const reportsBase = tenantDashboardPath(tenantSlug, "/reports");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`${reportsBase}/tax`}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Invoice-wise tax report
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          href={tenantDashboardPath(tenantSlug, "/products")}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          Product-wise tax (products)
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-4">
        <FormField label="Tax name" htmlFor="tax-name">
          <FormInput
            id="tax-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="VAT 15%"
          />
        </FormField>
        <FormField label="Rate %" htmlFor="tax-rate">
          <FormInput
            id="tax-rate"
            type="number"
            step="0.01"
            value={draft.rate}
            onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
          />
        </FormField>
        <FormSelect2
          label="Type"
          htmlFor="tax-type"
          value={draft.type}
          onChange={(v) => setDraft((d) => ({ ...d, type: v }))}
          options={[
            { value: "percentage", label: "Percentage" },
            { value: "fixed", label: "Fixed" },
          ]}
        />
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            <Plus className="h-4 w-4 mr-1" />
            Add tax
          </Button>
        </div>
      </form>

      {taxes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tax rates configured.</p>
      ) : (
        <ul className="space-y-2">
          {taxes.map((t) => (
            <li
              key={t.id}
              className="rounded-md border px-3 py-2 text-sm space-y-2"
            >
              {editingId === t.id ? (
                <div className="grid gap-2 sm:grid-cols-4 items-end">
                  <FormInput
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                  <FormInput
                    type="number"
                    step="0.01"
                    value={editDraft.rate}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, rate: e.target.value }))
                    }
                  />
                  <FormSelect2
                    label=""
                    value={editDraft.type}
                    onChange={(v) => setEditDraft((d) => ({ ...d, type: v }))}
                    options={[
                      { value: "percentage", label: "Percentage" },
                      { value: "fixed", label: "Fixed" },
                    ]}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => saveEdit(t.id)}
                      disabled={loading}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{t.name}</span>
                    <Badge variant="outline">
                      {t.rate}% ({t.type})
                    </Badge>
                    {!t.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id={`tax-active-${t.id}`}
                        checked={t.isActive}
                        onCheckedChange={() => toggleActive(t.id)}
                      />
                      <Label htmlFor={`tax-active-${t.id}`} className="text-xs">
                        Active
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(t)}
                      title="Edit tax"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(t)}
                      title="Delete tax"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
