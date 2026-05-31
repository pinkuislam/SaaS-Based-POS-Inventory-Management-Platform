"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download } from "lucide-react";

const SAMPLE_CSV = `name,sku,barcode,purchaseprice,sellingprice,stock,reorderlevel
Sample Product,SKU-001,8901001001999,100,150,50,10`;

export function ProductImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      notify.error("Select a CSV file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify.success(
        `Import done: ${data.created} created, ${data.updated} updated`
      );
      if (data.errors?.length) {
        console.warn("Import errors:", data.errors);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 rounded-lg border bg-background hover:bg-muted h-8 px-2.5 text-sm font-medium">
        <Upload className="h-4 w-4" />
        Import CSV
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Columns: name, sku, barcode, purchaseprice, sellingprice, stock,
            reorderlevel. Existing SKUs will be updated (stock added).
          </p>
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm"
          />
          <Button onClick={handleImport} className="w-full" disabled={loading}>
            {loading ? "Importing..." : "Import Products"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
