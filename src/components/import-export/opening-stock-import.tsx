"use client";

import { useRef, useState } from "react";
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
import { ImportErrorReport } from "@/components/import-export/import-error-report";

const SAMPLE = `sku,name,stock
SKU-001,Sample Product,100`;

export function OpeningStockImport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([SAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "opening-stock-template.csv";
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
    setErrors([]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/products/opening-stock", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(`Updated stock for ${data.updated} product(s)`);
      if (data.errors?.length) setErrors(data.errors);
      else setOpen(false);
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
        Import opening stock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import opening stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set stock quantities for existing products by SKU or name. Creates an
            opening stock movement for each row.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Download template
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
          <ImportErrorReport errors={errors} />
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? "Importing..." : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
