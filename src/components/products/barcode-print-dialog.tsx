"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { barcodePrintSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Barcode } from "lucide-react";
import type { SerializedProductClient } from "@/lib/serialize";

export function BarcodePrintDialog({
  product,
}: {
  product: Pick<
    SerializedProductClient,
    "id" | "name" | "sku" | "barcode" | "sellingPrice"
  >;
}) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    {
      copies: "1",
      code: product.barcode || product.sku || product.id,
    },
    barcodePrintSchema
  );

  useEffect(() => {
    if (!open || !printRef.current) return;
    const containers = printRef.current.querySelectorAll(".barcode-canvas");
    containers.forEach((container) => {
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      try {
        JsBarcode(svg, form.code, {
          format: "CODE128",
          width: 1.5,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
        container.innerHTML = "";
        container.appendChild(svg);
      } catch {
        container.textContent = "Invalid barcode";
      }
    });
  }, [open, form.code, form.copies]);

  function handlePrint() {
    if (!validate()) return;
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Barcode - ${product.name}</title>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 8px; }
        .label { display: inline-block; text-align: center; padding: 8px; margin: 4px; border: 1px dashed #ccc; page-break-inside: avoid; width: 180px; }
        .name { font-size: 11px; font-weight: bold; margin-bottom: 4px; word-wrap: break-word; }
        .price { font-size: 10px; margin-top: 4px; }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  }

  const numCopies = Math.min(parseInt(form.copies) || 1, 50);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center rounded-lg hover:bg-muted h-8 w-8"
      >
        <Barcode className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print Barcode Label</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            label="Barcode value"
            htmlFor="code"
            required
            error={fe("code")}
          >
            <FormInput
              id="code"
              value={form.code}
              error={fe("code")}
              onChange={(e) => setField("code", e.target.value)}
            />
          </FormField>
          <FormField
            label="Number of copies"
            htmlFor="copies"
            required
            error={fe("copies")}
          >
            <FormInput
              id="copies"
              type="number"
              min={1}
              max={50}
              value={form.copies}
              error={fe("copies")}
              onChange={(e) => setField("copies", e.target.value)}
            />
          </FormField>
          <div
            ref={printRef}
            className="flex flex-wrap gap-2 border rounded-lg p-4 bg-white"
          >
            {Array.from({ length: numCopies }).map((_, i) => (
              <div key={i} className="label inline-block text-center p-2 border border-dashed w-[180px]">
                <div className="name text-xs font-bold mb-1">{product.name}</div>
                <div className="barcode-canvas" />
                <div className="price text-[10px] mt-1">
                  ৳{Number(product.sellingPrice).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <Button type="button" className="w-full" onClick={handlePrint}>
            Print Labels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
