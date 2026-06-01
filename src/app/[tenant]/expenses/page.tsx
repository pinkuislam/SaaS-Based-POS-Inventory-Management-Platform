import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, decimalToNumber } from "@/lib/utils";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { ExpenseCategoryManager } from "@/components/expenses/expense-category-manager";
import { ExpensesListSection } from "@/components/expenses/expenses-list-section";
import { StatCard } from "@/components/ui/stat-card";
import { Wallet } from "lucide-react";

export default async function ExpensesPage() {
  const tenantId = await getTenantId();

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { tenantId, deletedAt: null },
      include: { category: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.expenseCategory.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

  const total = expenses.reduce(
    (s, e) => s + decimalToNumber(e.amount),
    0
  );

  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const monthTotal = thisMonth.reduce(
    (s, e) => s + decimalToNumber(e.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track business expenses</p>
        </div>
        <ExpenseFormDialog categories={categories} />
      </div>

      <ExpenseCategoryManager />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(total)}
          icon={Wallet}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(monthTotal)}
          description={`${thisMonth.length} records`}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesListSection
            categories={categories}
            initialExpenses={expenses.map((e) => ({
              id: e.id,
              title: e.title,
              categoryId: e.categoryId,
              categoryName: e.category?.name ?? null,
              amount: decimalToNumber(e.amount),
              expenseDate: e.expenseDate.toISOString(),
              notes: e.notes,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
