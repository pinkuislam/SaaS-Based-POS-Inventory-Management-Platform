"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CustomerFormDialog({
  groups = [],
}: {
  groups?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    customerType: "retail",
    openingBalance: "",
    creditLimit: "",
    groupId: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          openingBalance: parseFloat(form.openingBalance) || 0,
          creditLimit: parseFloat(form.creditLimit) || 0,
          groupId: form.groupId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Customer added");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-2.5 text-sm font-medium">
        <Plus className="h-4 w-4" />
        Add Customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
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
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={form.customerType}
                onChange={(e) =>
                  setForm({ ...form, customerType: e.target.value })
                }
                placeholder="retail / wholesale"
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
              />
            </div>
          </div>
          {groups.length > 0 && (
            <div className="space-y-2">
              <Label>Customer Group</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.groupId}
                onChange={(e) =>
                  setForm({ ...form, groupId: e.target.value })
                }
              >
                <option value="">None</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Credit Limit</Label>
            <Input
              type="number"
              step="0.01"
              value={form.creditLimit}
              onChange={(e) =>
                setForm({ ...form, creditLimit: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
