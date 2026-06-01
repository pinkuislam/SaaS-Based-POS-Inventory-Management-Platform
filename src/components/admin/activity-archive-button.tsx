"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { Archive } from "lucide-react";
import { ActionButton } from "@/components/admin/loading-button";

export function ActivityArchiveButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function archiveOld() {
    const confirmed = await confirmAction({
      title: "Archive old activity logs?",
      text: "Logs older than 90 days will be permanently removed.",
      confirmText: "Archive",
      icon: "warning",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity", {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        notify.success(`Archived ${data.deleted ?? 0} log entries`);
        router.refresh();
      } else {
        notify.error(typeof data.error === "string" ? data.error : "Archive failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton variant="outline" onClick={archiveOld} loading={loading} loadingText="Archiving...">
      <Archive className="mr-2 h-4 w-4" />
      Archive logs (90+ days)
    </ActionButton>
  );
}
