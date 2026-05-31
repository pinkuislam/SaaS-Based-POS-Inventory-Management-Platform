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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export function ExpenseFormDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    categoryId: "",
    categoryName: "",
    expenseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount),
          categoryId: useNewCategory ? null : form.categoryId || null,
          categoryName: useNewCategory ? form.categoryName : null,
          expenseDate: form.expenseDate,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Expense recorded");
      setOpen(false);
      setForm({
        title: "",
        amount: "",
        categoryId: "",
        categoryName: "",
        expenseDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      router.refresh();
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 px-2.5 text-sm font-medium">
        <Plus className="h-4 w-4" />
        Add Expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Electricity bill"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.expenseDate}
                onChange={(e) =>
                  setForm({ ...form, expenseDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setUseNewCategory(!useNewCategory)}
              >
                {useNewCategory ? "Use existing" : "New category"}
              </button>
            </div>
            {useNewCategory ? (
              <Input
                value={form.categoryName}
                onChange={(e) =>
                  setForm({ ...form, categoryName: e.target.value })
                }
                placeholder="Category name"
              />
            ) : (
              <Select
                value={form.categoryId}
                onValueChange={(v) => v && setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
