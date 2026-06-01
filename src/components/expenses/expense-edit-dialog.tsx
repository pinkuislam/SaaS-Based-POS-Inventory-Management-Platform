"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export function ExpenseEditDialog({
  expense,
  categories,
}: {
  expense: {
    id: string;
    title: string;
    amount: number;
    categoryId: string | null;
    expenseDate: string;
    notes: string | null;
  };
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState(expense.categoryId || "");
  const [expenseDate, setExpenseDate] = useState(
    expense.expenseDate.slice(0, 10)
  );
  const [notes, setNotes] = useState(expense.notes || "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          categoryId: categoryId || null,
          expenseDate,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Expense updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmDelete("Archive this expense?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      notify.success("Expense archived");
      setOpen(false);
      router.refresh();
    } catch {
      notify.error("Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Title" htmlFor="ex-title" required>
            <FormInput
              id="ex-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount" htmlFor="ex-amount" required>
              <FormInput
                id="ex-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormField>
            <FormField label="Date" htmlFor="ex-date">
              <FormInput
                id="ex-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </FormField>
          </div>
          <FormSelect2
            label="Category"
            htmlFor="ex-cat"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            placeholder="Select category"
          />
          <FormField label="Notes" htmlFor="ex-notes">
            <FormInput
              id="ex-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
