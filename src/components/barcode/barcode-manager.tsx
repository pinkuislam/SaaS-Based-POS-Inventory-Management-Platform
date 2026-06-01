"use client";

import { useMemo, useRef, useState } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { BarcodePrintDialog } from "@/components/products/barcode-print-dialog";
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
import { formatCurrency } from "@/lib/utils";
import { Barcode, Printer, Wand2 } from "lucide-react";

export function BarcodeManager({
  initialProducts,
}: {
  initialProducts: BarcodeProduct[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<BarcodeLabelOptions>(
    DEFAULT_LABEL_OPTIONS
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
    );
  }, [products, search]);

  const selectedProducts = products.filter((p) => selected.has(p.id));

  function toggleAll(checked: boolean) {
    if (checked) setSelected(new Set(filtered.map((p) => p.id)));
    else setSelected(new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function generateBarcodes(forIds?: string[]) {
    const ids = forIds ?? [...selected];
    if (ids.length === 0) {
      notify.error("Select at least one product");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/products/barcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids, generateMissing: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const map = new Map(
        (json.updated as { id: string; barcode: string }[]).map((u) => [
          u.id,
          u.barcode,
        ])
      );
      setProducts((prev) =>
        prev.map((p) =>
          map.has(p.id) ? { ...p, barcode: map.get(p.id)! } : p
        )
      );
      notify.success(`Generated ${json.count} barcode(s)`);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  }

  function handleBulkPrint() {
    if (selectedProducts.length === 0) {
      notify.error("Select products to print");
      return;
    }
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      buildBarcodePrintHtml(content, "Bulk barcode labels")
    );
    win.document.close();
    win.print();
  }

  const bulkLabels = selectedProducts.flatMap((p) => {
    const code = generateBarcodeValue(p);
    return Array.from({ length: options.copies }).map((_, i) => (
      <BarcodeLabelBlock
        key={`${p.id}-${i}`}
        product={p}
        code={code}
        options={options}
      />
    ));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Barcode & Labels</h1>
        <p className="text-muted-foreground">
          Generate barcodes, configure label layout, and print single or bulk labels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Label options</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormSelect2
            label="Barcode format"
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
              { value: "small", label: "Small (140px)" },
              { value: "medium", label: "Medium (180px)" },
              { value: "large", label: "Large (240px)" },
            ]}
          />
          <FormField label="Copies per product" htmlFor="bulk-copies">
            <FormInput
              id="bulk-copies"
              type="number"
              min={1}
              max={50}
              value={String(options.copies)}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  copies: Math.min(
                    50,
                    Math.max(1, parseInt(e.target.value, 10) || 1)
                  ),
                }))
              }
            />
          </FormField>
          <div className="flex flex-col gap-2 justify-end">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-name"
                checked={options.showName}
                onCheckedChange={(c) =>
                  setOptions((o) => ({ ...o, showName: c === true }))
                }
              />
              <Label htmlFor="show-name">Product name</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-sku"
                checked={options.showSku}
                onCheckedChange={(c) =>
                  setOptions((o) => ({ ...o, showSku: c === true }))
                }
              />
              <Label htmlFor="show-sku">SKU</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-price"
                checked={options.showPrice}
                onCheckedChange={(c) =>
                  setOptions((o) => ({ ...o, showPrice: c === true }))
                }
              />
              <Label htmlFor="show-price">Price</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Products</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={generating || selected.size === 0}
              onClick={() => generateBarcodes()}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Generate barcode
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={handleBulkPrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print bulk ({selected.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AdminListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search products..."
          />
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filtered.length > 0 &&
                        filtered.every((p) => selected.has(p.id))
                      }
                      onCheckedChange={(c) => toggleAll(c === true)}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={(c) => toggleOne(p.id, c === true)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.barcode || (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(p.sellingPrice)}</TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      {!p.barcode ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Generate barcode"
                          disabled={generating}
                          onClick={() => generateBarcodes([p.id])}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <BarcodePrintDialog
                        product={p}
                        labelOptions={options}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedProducts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Barcode className="h-4 w-4" />
              Bulk print preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={printRef}
              className="flex flex-wrap gap-2 border rounded-lg p-4 bg-white"
            >
              {bulkLabels}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
