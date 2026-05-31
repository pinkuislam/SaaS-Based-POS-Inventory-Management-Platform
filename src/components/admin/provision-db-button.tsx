"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
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
    const confirmed = await confirmAction({
      title: "Provision dedicated database?",
      text: "A separate MySQL database will be created. Existing shared-DB data is not migrated automatically.",
      confirmText: "Yes, provision",
      icon: "warning",
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/provision-db`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to provision database"
        );
      }
      notify.success(
        data.dbName
          ? `Database provisioned: ${data.dbName}`
          : "Database provisioned successfully"
      );
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Provision failed");
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
