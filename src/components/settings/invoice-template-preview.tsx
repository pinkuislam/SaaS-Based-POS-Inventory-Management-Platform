"use client";

import { format } from "date-fns";
import type { TenantInvoiceSettings } from "@/lib/tenant-settings";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SAMPLE = {
  invoiceNo: "INV-2026-0042",
  date: new Date(),
  customer: "Walk-in Customer",
  items: [
    { name: "Sample Product A", qty: 2, price: 450, total: 900 },
    { name: "Sample Product B", qty: 1, price: 320, total: 320 },
  ],
  subtotal: 1220,
  discount: 20,
  tax: 183,
  total: 1383,
  paid: 1000,
  due: 383,
};

export function InvoiceTemplatePreview({
  settings,
  businessName,
  logoUrl,
}: {
  settings: TenantInvoiceSettings & {
    prefix?: string;
    showTax?: boolean;
    showDiscount?: boolean;
    showCustomerDue?: boolean;
    defaultPrintFormat?: "thermal" | "a4";
    thermalLayout?: "compact" | "standard";
    a4Layout?: "classic" | "modern";
    showLogo?: boolean;
  };
  businessName: string;
  logoUrl?: string | null;
}) {
  const isThermal = settings.defaultPrintFormat !== "a4";
  const compact = settings.thermalLayout === "compact";

  if (isThermal) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thermal receipt preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`mx-auto bg-white text-black border rounded shadow-sm font-mono ${
              compact ? "max-w-[220px] text-[10px] p-2" : "max-w-[280px] text-xs p-3"
            }`}
          >
            {settings.showLogo !== false && logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className={`mx-auto object-contain mb-2 ${compact ? "h-8" : "h-12"}`}
              />
            ) : null}
            <p className="text-center font-bold">{businessName}</p>
            <p className="text-center text-[10px] opacity-70">
              {settings.prefix ?? "INV"}-{format(SAMPLE.date, "yyyy")}-####
            </p>
            <hr className="my-2 border-dashed border-gray-400" />
            <p>#{SAMPLE.invoiceNo}</p>
            <p>{format(SAMPLE.date, "dd/MM/yyyy HH:mm")}</p>
            <p>{SAMPLE.customer}</p>
            <hr className="my-2 border-dashed border-gray-400" />
            {SAMPLE.items.map((item, i) => (
              <div key={i} className="mb-1">
                <p className="truncate">{item.name}</p>
                <p className="flex justify-between">
                  <span>
                    {item.qty} x {formatCurrency(item.price)}
                  </span>
                  <span>{formatCurrency(item.total)}</span>
                </p>
              </div>
            ))}
            <hr className="my-2 border-dashed border-gray-400" />
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(SAMPLE.subtotal)}</span>
            </p>
            {settings.showDiscount !== false ? (
              <p className="flex justify-between">
                <span>Discount</span>
                <span>-{formatCurrency(SAMPLE.discount)}</span>
              </p>
            ) : null}
            {settings.showTax !== false ? (
              <p className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(SAMPLE.tax)}</span>
              </p>
            ) : null}
            <p className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(SAMPLE.total)}</span>
            </p>
            {settings.showCustomerDue !== false ? (
              <>
                <p className="flex justify-between">
                  <span>Paid</span>
                  <span>{formatCurrency(SAMPLE.paid)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Due</span>
                  <span>{formatCurrency(SAMPLE.due)}</span>
                </p>
              </>
            ) : null}
            {settings.footerText ? (
              <p className="text-center mt-2 text-[10px]">{settings.footerText}</p>
            ) : null}
            {settings.terms ? (
              <p className="text-[9px] mt-1 opacity-70">{settings.terms}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  }

  const modern = settings.a4Layout === "modern";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">A4 invoice preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`mx-auto max-w-lg bg-white text-black border rounded shadow-sm p-6 text-sm ${
            modern ? "border-primary/20" : ""
          }`}
        >
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              {settings.showLogo !== false && logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-14 object-contain mb-2" />
              ) : null}
              <h2 className="text-lg font-bold">{businessName}</h2>
              <p className="text-muted-foreground text-xs">Tax invoice</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{SAMPLE.invoiceNo}</p>
              <p className="text-xs text-muted-foreground">
                {format(SAMPLE.date, "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <p className="mb-4">
            <span className="text-muted-foreground">Bill to: </span>
            {SAMPLE.customer}
          </p>
          <table className="w-full mb-4 text-xs">
            <thead>
              <tr className={modern ? "bg-muted" : "border-b"}>
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.items.map((item, i) => (
                <tr key={i} className="border-b border-dashed">
                  <td className="py-2">{item.name}</td>
                  <td className="text-right py-2">{item.qty}</td>
                  <td className="text-right py-2">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-xs">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(SAMPLE.subtotal)}</span>
              </p>
              {settings.showDiscount !== false ? (
                <p className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(SAMPLE.discount)}</span>
                </p>
              ) : null}
              {settings.showTax !== false ? (
                <p className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(SAMPLE.tax)}</span>
                </p>
              ) : null}
              <p className="flex justify-between font-bold text-sm border-t pt-1">
                <span>Total</span>
                <span>{formatCurrency(SAMPLE.total)}</span>
              </p>
              {settings.showCustomerDue !== false ? (
                <p className="flex justify-between text-muted-foreground">
                  <span>Due</span>
                  <span>{formatCurrency(SAMPLE.due)}</span>
                </p>
              ) : null}
            </div>
          </div>
          {settings.footerText ? (
            <p className="text-center text-xs mt-6 text-muted-foreground">
              {settings.footerText}
            </p>
          ) : null}
          {settings.terms ? (
            <p className="text-[10px] mt-2 text-muted-foreground">
              {settings.terms}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
