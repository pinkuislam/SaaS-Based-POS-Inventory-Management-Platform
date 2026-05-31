"use client";

import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ThermalReceiptProps {
  sale: {
    invoiceNo: string;
    saleDate: Date | string;
    paymentMethod: string;
    subtotal: unknown;
    discount: unknown;
    tax: unknown;
    total: unknown;
    paidAmount: unknown;
    dueAmount: unknown;
    customer?: { name: string } | null;
    user?: { name: string } | null;
    tenant?: { name: string; phone?: string | null };
    items: {
      name?: string;
      product: { name: string };
      quantity: unknown;
      unitPrice: unknown;
      total: unknown;
    }[];
  };
}

export function ThermalReceipt({ sale }: ThermalReceiptProps) {
  function handlePrint() {
    window.print();
  }

  const line = "--------------------------------";

  return (
    <>
      <div className="print:hidden mb-4 flex gap-2">
        <Button onClick={handlePrint} size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Thermal (80mm)
        </Button>
      </div>

      <div id="thermal-receipt" className="thermal-receipt-root">
        <div className="thermal-receipt">
          <p className="center bold">{sale.tenant?.name || "STORE"}</p>
          {sale.tenant?.phone && (
            <p className="center small">Tel: {sale.tenant.phone}</p>
          )}
          <p className="center small">{line}</p>
          <p className="small">INV: {sale.invoiceNo}</p>
          <p className="small">Date: {formatDate(sale.saleDate)}</p>
          <p className="small">
            Customer: {sale.customer?.name || "Walk-in"}
          </p>
          <p className="small">Cashier: {sale.user?.name || "—"}</p>
          <p className="small">{line}</p>

          {sale.items.map((item, i) => (
            <div key={i} className="item-block">
              <p className="item-name">{item.product.name}</p>
              <p className="small row">
                <span>
                  {decimalToNumber(item.quantity)} x{" "}
                  {formatCurrency(decimalToNumber(item.unitPrice))}
                </span>
                <span>{formatCurrency(decimalToNumber(item.total))}</span>
              </p>
            </div>
          ))}

          <p className="small">{line}</p>
          <p className="small row">
            <span>Subtotal</span>
            <span>{formatCurrency(decimalToNumber(sale.subtotal))}</span>
          </p>
          {decimalToNumber(sale.discount) > 0 && (
            <p className="small row">
              <span>Discount</span>
              <span>-{formatCurrency(decimalToNumber(sale.discount))}</span>
            </p>
          )}
          {decimalToNumber(sale.tax) > 0 && (
            <p className="small row">
              <span>Tax</span>
              <span>{formatCurrency(decimalToNumber(sale.tax))}</span>
            </p>
          )}
          <p className="bold row total-line">
            <span>TOTAL</span>
            <span>{formatCurrency(decimalToNumber(sale.total))}</span>
          </p>
          <p className="small row">
            <span>Paid ({sale.paymentMethod})</span>
            <span>{formatCurrency(decimalToNumber(sale.paidAmount))}</span>
          </p>
          {decimalToNumber(sale.dueAmount) > 0 && (
            <p className="small row">
              <span>Due</span>
              <span>{formatCurrency(decimalToNumber(sale.dueAmount))}</span>
            </p>
          )}
          <p className="center small mt">{line}</p>
          <p className="center small">Thank you!</p>
        </div>
      </div>

      <style jsx global>{`
        .thermal-receipt-root {
          display: flex;
          justify-content: center;
        }
        .thermal-receipt {
          width: 80mm;
          max-width: 80mm;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          line-height: 1.35;
          color: #000;
          background: #fff;
          padding: 4mm;
          box-sizing: border-box;
        }
        .thermal-receipt .center {
          text-align: center;
        }
        .thermal-receipt .bold {
          font-weight: bold;
          font-size: 14px;
        }
        .thermal-receipt .small {
          font-size: 11px;
          margin: 2px 0;
        }
        .thermal-receipt .row {
          display: flex;
          justify-content: space-between;
        }
        .thermal-receipt .item-name {
          font-weight: bold;
          margin-top: 6px;
          margin-bottom: 0;
        }
        .thermal-receipt .total-line {
          font-size: 14px;
          margin: 6px 0;
        }
        .thermal-receipt .mt {
          margin-top: 8px;
        }
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt,
          #thermal-receipt * {
            visibility: visible !important;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
          }
          .thermal-receipt-root {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
