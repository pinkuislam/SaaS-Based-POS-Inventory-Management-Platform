"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { Button } from "@/components/ui/button";

export function DatabaseActions({
  tenantId,
  provisioned,
}: {
  tenantId: string;
  provisioned: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function runAction(action: string) {
    if (action === "provision") {
      const confirmed = await confirmAction({
        title: "Provision dedicated database?",
        text: "A separate MySQL database will be created. Existing shared-DB data is not migrated automatically.",
        confirmText: "Yes, provision",
        icon: "warning",
      });
      if (!confirmed) return;
    }

    setLoading(action);
    try {
      const res = await fetch("/api/admin/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        notify.success(
          action === "backup"
            ? `Backup saved (${data.fileName || "success"})`
            : data.message || "Success"
        );
        router.refresh();
      } else {
        notify.error(data.error || "Failed");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      {!provisioned && (
        <Button size="sm" variant="outline" onClick={() => runAction("provision")}>
          Provision
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        disabled={!provisioned || loading !== null}
        title={
          provisioned
            ? "Create SQL backup of dedicated tenant database"
            : "Provision a dedicated database before backup"
        }
        onClick={() => runAction("backup")}
      >
        {loading === "backup" ? "Backing up…" : "Record Backup"}
      </Button>
    </div>
  );
}
