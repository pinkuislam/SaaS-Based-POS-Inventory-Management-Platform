"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Trash2 } from "lucide-react";
import { ActionButton, ActionIconButton } from "@/components/admin/loading-button";

export function TicketActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        notify.success(`Ticket marked ${newStatus}`);
        router.refresh();
      } else {
        notify.error("Update failed");
      }
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    const ok = await confirmDelete("this support ticket");
    if (!ok) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notify.success("Ticket deleted");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        notify.error(data.error || "Delete failed");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-1">
      {status === "open" && (
        <ActionButton
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          loading={loading === "in_progress"}
          loadingText="..."
          disabled={loading !== null && loading !== "in_progress"}
          onClick={() => updateStatus("in_progress")}
        >
          In Progress
        </ActionButton>
      )}
      {status !== "closed" && (
        <ActionButton
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          loading={loading === "closed"}
          loadingText="..."
          disabled={loading !== null && loading !== "closed"}
          onClick={() => updateStatus("closed")}
        >
          Close
        </ActionButton>
      )}
      <ActionIconButton
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        loading={loading === "delete"}
        onClick={remove}
        aria-label="Delete ticket"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </ActionIconButton>
    </div>
  );
}
