"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExpensesTable, type ExpenseTableRow } from "@/components/expenses/expenses-table";
import { decimalToNumber } from "@/lib/utils";

type Category = { id: string; name: string };

export function ExpensesListSection({
  initialExpenses,
  categories,
}: {
  initialExpenses: ExpenseTableRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = showArchived ? "?show=all" : "";
    fetch(`/api/expenses${q}`)
      .then((r) => r.json())
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setExpenses(
          rows.map(
            (e: {
              id: string;
              title: string;
              categoryId: string | null;
              category?: { name: string } | null;
              amount: unknown;
              expenseDate: string;
              notes: string | null;
              deletedAt: string | null;
            }) => ({
              id: e.id,
              title: e.title,
              categoryId: e.categoryId,
              categoryName: e.category?.name ?? null,
              amount: decimalToNumber(e.amount),
              expenseDate: e.expenseDate,
              notes: e.notes,
              deletedAt: e.deletedAt,
            })
          )
        );
      })
      .finally(() => setLoading(false));
  }, [showArchived]);

  async function restoreExpense(id: string) {
    const res = await fetch(`/api/expenses/${id}/restore`, { method: "POST" });
    if (!res.ok) {
      notify.error("Restore failed");
      return;
    }
    notify.success("Expense restored");
    router.refresh();
    setShowArchived(false);
  }

  const active = expenses.filter((e) => !e.deletedAt);
  const archived = expenses.filter((e) => e.deletedAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-archived-expenses"
          checked={showArchived}
          onCheckedChange={(c) => setShowArchived(c === true)}
        />
        <Label htmlFor="show-archived-expenses">Show archived expenses</Label>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : showArchived ? (
        archived.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived expenses.</p>
        ) : (
          <ul className="space-y-2">
            {archived.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between border rounded px-3 py-2 text-sm"
              >
                <span>
                  {e.title} · {e.categoryName || "Uncategorized"}
                </span>
                <Button size="sm" variant="outline" onClick={() => restoreExpense(e.id)}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )
      ) : active.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No expenses recorded yet.
        </p>
      ) : (
        <ExpensesTable categories={categories} expenses={active} />
      )}
    </div>
  );
}
