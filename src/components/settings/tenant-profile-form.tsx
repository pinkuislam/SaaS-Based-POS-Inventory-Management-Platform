"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [form, setForm] = useState({
    name: tenant.name,
    phone: tenant.phone || "",
    address: tenant.address || "",
    defaultTaxRate: String(settings.pos?.defaultTaxRate ?? 0),
    receiptFooter: settings.pos?.receiptFooter || "Thank you for your business!",
    loyaltyEnabled: settings.loyalty?.enabled ?? false,
    spendPerPoint: String(settings.loyalty?.spendPerPoint ?? 100),
    valuePerPoint: String(settings.loyalty?.valuePerPoint ?? 1),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          settings: {
            pos: {
              defaultTaxRate: parseFloat(form.defaultTaxRate) || 0,
              receiptFooter: form.receiptFooter,
            },
            loyalty: {
              enabled: form.loyaltyEnabled,
              spendPerPoint: parseFloat(form.spendPerPoint) || 100,
              valuePerPoint: parseFloat(form.valuePerPoint) || 1,
            },
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Business Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Default Tax % (POS)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.defaultTaxRate}
            onChange={(e) => setForm({ ...form, defaultTaxRate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Textarea
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Receipt Footer</Label>
        <Input
          value={form.receiptFooter}
          onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
        />
      </div>
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="loyaltyEnabled"
            checked={form.loyaltyEnabled}
            onCheckedChange={(c) =>
              setForm({ ...form, loyaltyEnabled: c === true })
            }
          />
          <Label htmlFor="loyaltyEnabled">Enable loyalty points</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Spend per 1 point (৳)</Label>
            <Input
              type="number"
              value={form.spendPerPoint}
              onChange={(e) =>
                setForm({ ...form, spendPerPoint: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Redeem value per point (৳)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.valuePerPoint}
              onChange={(e) =>
                setForm({ ...form, valuePerPoint: e.target.value })
              }
            />
          </div>
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Profile & POS Settings"}
      </Button>
    </form>
  );
}
