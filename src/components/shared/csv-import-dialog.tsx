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

export function CsvImportDialog({
  title,
  apiPath,
  sampleCsv,
  sampleFilename,
}: {
  title: string;
  apiPath: string;
  sampleCsv: string;
  sampleFilename: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sampleFilename;
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
      const res = await fetch(apiPath, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify.success(`Imported ${data.created} record(s)`);
      if (data.errors?.length) {
        notify.warning(`${data.errors.length} row(s) had errors`);
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
      <DialogTrigger render={<Button />}>
        <Upload className="h-4 w-4 mr-2" />
        {title}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download template
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" />
          <Button onClick={handleImport} disabled={loading}>
            {loading ? "Importing..." : "Upload CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
