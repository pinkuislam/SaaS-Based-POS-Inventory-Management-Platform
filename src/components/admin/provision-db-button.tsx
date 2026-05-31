"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export function ProvisionDbButton({
  tenantId,
  dbProvisioned,
  dbName,
}: {
  tenantId: string;
  dbProvisioned: boolean;
  dbName: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleProvision() {
    if (
      !confirm(
        "Create a separate MySQL database for this tenant and apply schema? Existing shared-DB data is not migrated automatically."
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/provision-db`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Database provisioned: ${data.dbName}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Provision failed");
    } finally {
      setLoading(false);
    }
  }

  if (dbProvisioned) {
    return (
      <span className="text-xs font-mono text-muted-foreground" title="Dedicated DB">
        DB: {dbName}
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={handleProvision}
      disabled={loading}
    >
      <Database className="h-3 w-3 mr-1" />
      {loading ? "..." : "Provision DB"}
    </Button>
  );
}
