"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { expenseFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormSelect2,
} from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export function ExpenseFormDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset, setValues } =
    useValidatedForm(
      {
        title: "",
        amount: "",
        categoryId: "",
        categoryName: "",
        expenseDate: new Date().toISOString().split("T")[0],
        notes: "",
        useNewCategory: false,
      },
      expenseFormSchema
    );

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  function toggleNewCategory() {
    setValues((prev) => ({
      ...prev,
      useNewCategory: !prev.useNewCategory,
      categoryId: "",
      categoryName: "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          amount: parseFloat(data.amount),
          categoryId: data.useNewCategory ? null : data.categoryId || null,
          categoryName: data.useNewCategory ? data.categoryName : null,
          expenseDate: data.expenseDate,
          notes: data.notes,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Expense recorded");
      setOpen(false);
      reset({
        title: "",
        amount: "",
        categoryId: "",
        categoryName: "",
        expenseDate: new Date().toISOString().split("T")[0],
        notes: "",
        useNewCategory: false,
      });
      router.refresh();
    } catch {
      notify.error("Failed to save expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add Expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Title"
            htmlFor="title"
            required
            error={fieldError("title")}
          >
            <FormInput
              id="title"
              name="title"
              value={values.title}
              error={fieldError("title")}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Electricity bill"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Amount"
              htmlFor="amount"
              required
              error={fieldError("amount")}
            >
              <FormInput
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={values.amount}
                error={fieldError("amount")}
                onChange={(e) => setField("amount", e.target.value)}
              />
            </FormField>
            <FormField
              label="Date"
              htmlFor="expenseDate"
              error={fieldError("expenseDate")}
            >
              <FormInput
                id="expenseDate"
                name="expenseDate"
                type="date"
                value={values.expenseDate}
                error={fieldError("expenseDate")}
                onChange={(e) => setField("expenseDate", e.target.value)}
              />
            </FormField>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Category</span>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={toggleNewCategory}
              >
                {values.useNewCategory ? "Use existing" : "New category"}
              </button>
            </div>
            {values.useNewCategory ? (
              <FormField
                htmlFor="categoryName"
                error={fieldError("categoryName")}
              >
                <FormInput
                  id="categoryName"
                  name="categoryName"
                  value={values.categoryName}
                  error={fieldError("categoryName")}
                  onChange={(e) => setField("categoryName", e.target.value)}
                  placeholder="Category name"
                />
              </FormField>
            ) : (
              <FormSelect2
                htmlFor="categoryId"
                options={categoryOptions}
                value={values.categoryId}
                onChange={(v) => setField("categoryId", v)}
                placeholder="Select category"
                error={fieldError("categoryId")}
              />
            )}
          </div>
          <FormField label="Notes" htmlFor="notes" error={fieldError("notes")}>
            <FormInput
              id="notes"
              name="notes"
              value={values.notes}
              error={fieldError("notes")}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
