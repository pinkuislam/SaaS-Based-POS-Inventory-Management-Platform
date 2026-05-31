"use client";

import {
  ReportExport,
  type ReportFilterOptions,
} from "@/components/reports/report-export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REPORT_TYPES = [
  { id: "sales", label: "Sales Report" },
  { id: "purchases", label: "Purchase Report" },
  { id: "stock", label: "Stock / Inventory Valuation" },
  { id: "profit", label: "Profit & Loss" },
  { id: "low_stock", label: "Low Stock" },
  { id: "product_sales", label: "Product-wise Sales" },
  { id: "category_sales", label: "Category-wise Sales" },
  { id: "user_sales", label: "User-wise Sales" },
  { id: "branch_sales", label: "Branch-wise Sales" },
  { id: "payment_methods", label: "Payment Methods" },
  { id: "tax", label: "Tax / VAT" },
  { id: "returns", label: "Sales Returns" },
  { id: "customer_due", label: "Customer Due" },
  { id: "supplier_due", label: "Supplier Due" },
  { id: "expiry", label: "Expiry Stock" },
  { id: "expenses", label: "Expense Report" },
];

export function ReportsHub({
  filterOptions,
}: {
  filterOptions?: ReportFilterOptions;
}) {
  return (
    <div className="space-y-6">
      <ReportExport reportTypes={REPORT_TYPES} filterOptions={filterOptions} />
      <Card>
        <CardHeader>
          <CardTitle>Available Reports (per requirements doc §4.9)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {REPORT_TYPES.map((r) => (
              <li key={r.id} className="text-muted-foreground">
                • {r.label}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
