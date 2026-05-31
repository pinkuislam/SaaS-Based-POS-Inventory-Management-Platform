"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";

export function BackupActions({
  backupId,
  canDownload,
}: {
  backupId: string;
  canDownload: boolean;
}) {
  const router = useRouter();

  async function remove() {
    const confirmed = await confirmDelete(
      "Delete this backup?",
      "The backup file will be removed from storage."
    );
    if (!confirmed) return;

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
      <Button size="sm" variant="ghost" onClick={remove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
