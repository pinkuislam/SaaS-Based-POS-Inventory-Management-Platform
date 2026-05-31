"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export function ReportsExportButtons() {
  function download(format: "pdf" | "csv", type: string) {
    window.open(`/api/admin/reports/export?format=${format}&type=${type}`, "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => download("pdf", "overview")}>
        <FileDown className="mr-1 h-3 w-3" />
        Overview PDF
      </Button>
      <Button size="sm" variant="outline" onClick={() => download("csv", "overview")}>
        Overview Excel (CSV)
      </Button>
      <Button size="sm" variant="outline" onClick={() => download("pdf", "revenue")}>
        Revenue PDF
      </Button>
      <Button size="sm" variant="outline" onClick={() => download("csv", "tenants")}>
        Tenants CSV
      </Button>
    </div>
  );
}
