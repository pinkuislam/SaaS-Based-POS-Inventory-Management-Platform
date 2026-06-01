"use client";

import { useRef, useState } from "react";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { barcodePrintSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Barcode } from "lucide-react";
import {
  BarcodeLabelBlock,
  buildBarcodePrintHtml,
  type BarcodeProduct,
} from "@/components/barcode/barcode-label-preview";
import {
  DEFAULT_LABEL_OPTIONS,
  generateBarcodeValue,
  type BarcodeFormat,
  type BarcodeLabelOptions,
  type LabelSize,
} from "@/lib/barcode-label";

export function BarcodePrintDialog({
  product,
  labelOptions: externalOptions,
}: {
  product: BarcodeProduct;
  labelOptions?: Partial<BarcodeLabelOptions>;
}) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const merged: BarcodeLabelOptions = {
    ...DEFAULT_LABEL_OPTIONS,
    ...externalOptions,
  };

  const [options, setOptions] = useState<BarcodeLabelOptions>(merged);

  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    {
      copies: String(merged.copies),
      code: generateBarcodeValue(product),
    },
    barcodePrintSchema
  );

  function handlePrint() {
    if (!validate()) return;
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      buildBarcodePrintHtml(content, `Barcode - ${product.name}`)
    );
    win.document.close();
    win.print();
  }

  const numCopies = Math.min(parseInt(form.copies) || 1, 50);
  const printOptions = {
    ...options,
    copies: numCopies,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg hover:bg-muted h-8 w-8">
        <Barcode className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSelect2
              label="Format"
              value={options.format}
              onChange={(v) =>
                setOptions((o) => ({ ...o, format: v as BarcodeFormat }))
              }
              options={[
                { value: "CODE128", label: "CODE128" },
                { value: "EAN13", label: "EAN-13" },
                { value: "UPC", label: "UPC" },
                { value: "CODE39", label: "CODE39" },
              ]}
            />
            <FormSelect2
              label="Label size"
              value={options.labelSize}
              onChange={(v) =>
                setOptions((o) => ({ ...o, labelSize: v as LabelSize }))
              }
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dlg-show-name"
                checked={options.showName}
                onCheckedChange={(c) =>
                  setOptions((o) => ({ ...o, showName: c === true }))
                }
              />
              <Label htmlFor="dlg-show-name">Name</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="dlg-show-sku"
                checked={options.showSku}
                onCheckedChange={(c) =>
                  setOptions((o) => ({ ...o, showSku: c === true }))
                }
              />
              <Label htmlFor="dlg-show-sku">SKU</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="dlg-show-price"
                checked={options.showPrice}
                onCheckedChange={(c) =>
                  setOptions((o) => ({ ...o, showPrice: c === true }))
                }
              />
              <Label htmlFor="dlg-show-price">Price</Label>
            </div>
          </div>
          <div
            ref={printRef}
            className="flex flex-wrap gap-2 border rounded-lg p-4 bg-white"
          >
            {Array.from({ length: numCopies }).map((_, i) => (
              <BarcodeLabelBlock
                key={i}
                product={product}
                code={form.code}
                options={printOptions}
              />
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
