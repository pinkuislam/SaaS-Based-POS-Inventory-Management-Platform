"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Download, Trash2 } from "lucide-react";
import { ActionIconButton } from "@/components/admin/loading-button";
import { Button } from "@/components/ui/button";

export function BackupActions({
  backupId,
  canDownload,
}: {
  backupId: string;
  canDownload: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    const confirmed = await confirmDelete(
      "Delete this backup?",
      "The backup file will be removed from storage."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/databases/backups/${backupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notify.success("Backup deleted");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        notify.error(typeof data.error === "string" ? data.error : "Delete failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1">
      {canDownload ? (
        <Link href={`/api/admin/databases/backups/${backupId}/download`}>
          <Button size="sm" variant="outline">
            <Download className="mr-1 h-3.5 w-3.5" />
            Download
          </Button>
        </Link>
      ) : null}
      <ActionIconButton
        size="sm"
        variant="ghost"
        loading={loading}
        onClick={remove}
        aria-label="Delete backup"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </ActionIconButton>
    </div>
  );
}
