"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

export function ActivityArchiveButton() {
  const router = useRouter();

  async function archiveOld() {
    const confirmed = await confirmAction({
      title: "Archive old activity logs?",
      text: "Logs older than 90 days will be permanently removed.",
      confirmText: "Archive",
      icon: "warning",
    });
    if (!confirmed) return;

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
  }

  return (
    <Button variant="outline" onClick={archiveOld}>
      <Archive className="mr-2 h-4 w-4" />
      Archive logs (90+ days)
    </Button>
  );
}
