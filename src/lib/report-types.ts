export type ReportTypeId =
  | "sales"
  | "purchases"
  | "product_catalog"
  | "stock"
  | "low_stock"
  | "out_of_stock"
  | "expiry"
  | "damaged_stock"
  | "stock_movements"
  | "product_sales"
  | "top_selling"
  | "slow_moving"
  | "category_sales"
  | "user_sales"
  | "branch_sales"
  | "payment_methods"
  | "payments"
  | "tax"
  | "returns"
  | "sale_returns"
  | "purchase_returns"
  | "customer_due"
  | "supplier_due"
  | "expenses"
  | "profit"
  | "daily_closing";

export type ReportNavItem = {
  id: ReportTypeId;
  label: string;
  advanced?: boolean;
};

export type ReportNavGroup = {
  title: string;
  items: ReportNavItem[];
};

export const REPORT_NAV_GROUPS: ReportNavGroup[] = [
  {
    title: "Sales & revenue",
    items: [
      { id: "sales", label: "Sales Report" },
      { id: "product_sales", label: "Product-wise Sales", advanced: true },
      { id: "top_selling", label: "Top-selling Products", advanced: true },
      { id: "slow_moving", label: "Slow-moving Products", advanced: true },
      { id: "category_sales", label: "Category-wise Sales", advanced: true },
      { id: "user_sales", label: "User-wise Sales", advanced: true },
      { id: "branch_sales", label: "Branch-wise Sales", advanced: true },
      { id: "payment_methods", label: "Payment Methods", advanced: true },
      { id: "payments", label: "Payment Report", advanced: true },
      { id: "tax", label: "Tax / VAT", advanced: true },
      { id: "returns", label: "Sales Returns (legacy)", advanced: true },
      { id: "sale_returns", label: "Sales Return Report", advanced: true },
      { id: "daily_closing", label: "Daily Closing", advanced: true },
    ],
  },
  {
    title: "Purchases & inventory",
    items: [
      { id: "purchases", label: "Purchase Report" },
      { id: "purchase_returns", label: "Purchase Return Report", advanced: true },
      { id: "product_catalog", label: "Product Report" },
      { id: "stock", label: "Stock / Inventory Valuation" },
      { id: "low_stock", label: "Low Stock", advanced: true },
      { id: "out_of_stock", label: "Out of Stock", advanced: true },
      { id: "expiry", label: "Expired Products", advanced: true },
      { id: "damaged_stock", label: "Damaged Stock", advanced: true },
      { id: "stock_movements", label: "Stock Movement", advanced: true },
    ],
  },
  {
    title: "Finance & dues",
    items: [
      { id: "profit", label: "Profit & Loss" },
      { id: "expenses", label: "Expense Report", advanced: true },
      { id: "customer_due", label: "Customer Due", advanced: true },
      { id: "supplier_due", label: "Supplier Due", advanced: true },
    ],
  },
];

export const ALL_REPORT_TYPES: ReportNavItem[] = REPORT_NAV_GROUPS.flatMap(
  (g) => g.items
);

export function getReportMeta(id: string): ReportNavItem | undefined {
  return ALL_REPORT_TYPES.find((r) => r.id === id);
}

export function isValidReportType(id: string): id is ReportTypeId {
  return ALL_REPORT_TYPES.some((r) => r.id === id);
}

/** Reports that use date range on transactions */
export const DATE_RANGE_REPORTS = new Set<ReportTypeId>([
  "sales",
  "purchases",
  "profit",
  "product_sales",
  "top_selling",
  "slow_moving",
  "category_sales",
  "user_sales",
  "branch_sales",
  "payment_methods",
  "payments",
  "tax",
  "returns",
  "sale_returns",
  "purchase_returns",
  "expenses",
  "expiry",
  "damaged_stock",
  "stock_movements",
  "daily_closing",
]);

/** Reports that support product filter */
export const PRODUCT_FILTER_REPORTS = new Set<ReportTypeId>([
  "sales",
  "purchases",
  "product_sales",
  "top_selling",
  "slow_moving",
  "stock_movements",
  "damaged_stock",
  "sale_returns",
  "purchase_returns",
  "product_catalog",
]);
