"use client";

import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface InvoiceProps {
  sale: {
    invoiceNo: string;
    saleDate: Date | string;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    subtotal: unknown;
    discount: unknown;
    tax: unknown;
    total: unknown;
    paidAmount: unknown;
    dueAmount: unknown;
    notes?: string | null;
    customer?: { name: string; phone?: string | null } | null;
    user?: { name: string } | null;
    tenant?: { name: string; phone?: string | null; address?: string | null };
    items: {
      id: string;
      quantity: unknown;
      returnedQty: unknown;
      unitPrice: unknown;
      discount: unknown;
      tax: unknown;
      total: unknown;
      product: { name: string; sku?: string | null };
    }[];
  };
}

export function InvoicePrint({ sale }: InvoiceProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <>
      <div className="print:hidden mb-4 flex gap-2">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      <div
        id="invoice"
        className="bg-white text-black p-8 max-w-lg mx-auto border rounded-lg print:border-0 print:shadow-none print:max-w-none"
      >
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold">{sale.tenant?.name || "Store"}</h1>
          {sale.tenant?.address && (
            <p className="text-sm text-gray-600">{sale.tenant.address}</p>
          )}
          {sale.tenant?.phone && (
            <p className="text-sm text-gray-600">{sale.tenant.phone}</p>
          )}
        </div>

        <div className="flex justify-between text-sm mb-4">
          <div>
            <p className="font-semibold">Invoice: {sale.invoiceNo}</p>
            <p>Date: {formatDate(sale.saleDate)}</p>
            <p>Cashier: {sale.user?.name || "—"}</p>
          </div>
          <div className="text-right">
            <p>Customer: {sale.customer?.name || "Walk-in"}</p>
            {sale.customer?.phone && <p>{sale.customer.phone}</p>}
            <p className="capitalize">Pay: {sale.paymentMethod}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2">Item</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2">
                  {item.product.name}
                  {item.product.sku && (
                    <span className="text-gray-500 text-xs block">
                      {item.product.sku}
                    </span>
                  )}
                </td>
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

        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(decimalToNumber(sale.subtotal))}</span>
          </div>
          {decimalToNumber(sale.discount) > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatCurrency(decimalToNumber(sale.discount))}</span>
            </div>
          )}
          {decimalToNumber(sale.tax) > 0 && (
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrency(decimalToNumber(sale.tax))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2">
            <span>Total</span>
            <span>{formatCurrency(decimalToNumber(sale.total))}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{formatCurrency(decimalToNumber(sale.paidAmount))}</span>
          </div>
          {decimalToNumber(sale.dueAmount) > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Due</span>
              <span>{formatCurrency(decimalToNumber(sale.dueAmount))}</span>
            </div>
          )}
        </div>

        {sale.notes && (
          <p className="text-xs text-gray-500 mt-4">Note: {sale.notes}</p>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Thank you for your business!
        </p>
        <p className="text-center text-xs text-gray-400">
          Status: {sale.status} | {sale.paymentStatus}
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice,
          #invoice * {
            visibility: visible;
          }
          #invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
