"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import type { SerializedSubscriptionPackage } from "@/lib/serialize";

type PackageData = SerializedSubscriptionPackage;

export function PackageFormDialog({
  pkg,
  mode = "create",
}: {
  pkg?: PackageData;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: pkg?.name || "",
    description: pkg?.description || "",
    price: pkg ? String(pkg.price) : "",
    billingCycle: pkg?.billingCycle || "monthly",
    trialDays: String(pkg?.trialDays ?? 14),
    graceDays: String(pkg?.graceDays ?? 7),
    maxUsers: String(pkg?.maxUsers ?? 2),
    maxBranches: String(pkg?.maxBranches ?? 1),
    maxProducts: String(pkg?.maxProducts ?? 500),
    maxInvoices: String(pkg?.maxInvoices ?? 1000),
    features: pkg?.features?.length ? pkg.features.join(", ") : "",
    isActive: pkg?.isActive ?? true,
    sortOrder: String(pkg?.sortOrder ?? 0),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      billingCycle: form.billingCycle,
      trialDays: parseInt(form.trialDays, 10),
      graceDays: parseInt(form.graceDays, 10),
      maxUsers: parseInt(form.maxUsers, 10),
      maxBranches: parseInt(form.maxBranches, 10),
      maxProducts: parseInt(form.maxProducts, 10),
      maxInvoices: parseInt(form.maxInvoices, 10),
      features: form.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder, 10),
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(mode === "edit" ? "Package updated" : "Package created");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Billing</Label>
              <Select
                value={form.billingCycle}
                onValueChange={(v) => v && setForm({ ...form, billingCycle: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trial Days</Label>
              <Input
                type="number"
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Grace Days (after expiry)</Label>
              <Input
                type="number"
                value={form.graceDays}
                onChange={(e) => setForm({ ...form, graceDays: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Users</Label>
              <Input
                type="number"
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Branches</Label>
              <Input
                type="number"
                value={form.maxBranches}
                onChange={(e) => setForm({ ...form, maxBranches: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Products</Label>
              <Input
                type="number"
                value={form.maxProducts}
                onChange={(e) => setForm({ ...form, maxProducts: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Invoices</Label>
              <Input
                type="number"
                value={form.maxInvoices}
                onChange={(e) => setForm({ ...form, maxInvoices: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Features (comma-separated)</Label>
            <Input
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              placeholder="POS, Inventory, Reports"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(c) => setForm({ ...form, isActive: c === true })}
            />
            Active package
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
