"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export function StatementExportButton({
  entityType,
  entityId,
  label = "Download Statement",
}: {
  entityType: "customers" | "suppliers";
  entityId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/${entityType}/${entityId}/statement`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${entityType.slice(0, -1)}-statement-${entityId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Statement downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <FileDown className="h-4 w-4 mr-2" />
      {loading ? "Exporting..." : label}
    </Button>
  );
}
