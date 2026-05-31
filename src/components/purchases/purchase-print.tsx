"use client";

import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PurchasePrintProps {
  purchase: {
    invoiceNo: string;
    purchaseDate: Date | string;
    paymentStatus: string;
    status: string;
    subtotal: unknown;
    discount: unknown;
    tax: unknown;
    total: unknown;
    paidAmount: unknown;
    dueAmount: unknown;
    notes?: string | null;
    supplier?: { name: string; phone?: string | null } | null;
    user?: { name: string } | null;
    tenant?: { name: string; phone?: string | null; address?: string | null };
    items: {
      quantity: unknown;
      unitPrice: unknown;
      total: unknown;
      product: { name: string; sku?: string | null };
    }[];
  };
}

export function PurchasePrint({ purchase }: PurchasePrintProps) {
  return (
    <>
      <div className="print:hidden mb-4">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print Purchase Invoice
        </Button>
      </div>
      <div className="bg-white text-black p-8 max-w-lg mx-auto border rounded-lg print:border-0">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold">{purchase.tenant?.name || "Store"}</h1>
          <p className="text-sm text-gray-600">PURCHASE INVOICE</p>
          <p className="font-mono mt-2">{purchase.invoiceNo}</p>
          <p className="text-sm">{formatDate(purchase.purchaseDate)}</p>
        </div>
        {purchase.supplier && (
          <p className="mb-4 text-sm">
            <strong>Supplier:</strong> {purchase.supplier.name}
            {purchase.supplier.phone && ` · ${purchase.supplier.phone}`}
          </p>
        )}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{item.product.name}</td>
                <td className="text-right py-2">
                  {decimalToNumber(item.quantity)}
                </td>
                <td className="text-right py-2">
                  {formatCurrency(decimalToNumber(item.unitPrice))}
                </td>
                <td className="text-right py-2">
                  {formatCurrency(decimalToNumber(item.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm space-y-1 border-t pt-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(decimalToNumber(purchase.total))}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{formatCurrency(decimalToNumber(purchase.paidAmount))}</span>
          </div>
          <div className="flex justify-between">
            <span>Due</span>
            <span>{formatCurrency(decimalToNumber(purchase.dueAmount))}</span>
          </div>
          <p className="text-gray-500 capitalize">{purchase.paymentStatus}</p>
        </div>
      </div>
    </>
  );
}
