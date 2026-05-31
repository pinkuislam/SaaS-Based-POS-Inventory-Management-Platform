import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { Wallet } from "lucide-react";

export default async function ExpensesPage() {
  const tenantId = await getTenantId();

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { tenantId },
      include: { category: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.expenseCategory.findMany({
      where: { tenantId },
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
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell>{e.category?.name || "—"}</TableCell>
                    <TableCell>
                      {formatCurrency(decimalToNumber(e.amount))}
                    </TableCell>
                    <TableCell>{formatDate(e.expenseDate)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {e.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
