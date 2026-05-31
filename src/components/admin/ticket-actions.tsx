"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function TicketActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
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
  }

  async function remove() {
    const ok = await confirmDelete("this support ticket");
    if (!ok) return;
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
  }

  return (
    <div className="flex gap-1">
      {status === "open" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => updateStatus("in_progress")}
        >
          In Progress
        </Button>
      )}
      {status !== "closed" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => updateStatus("closed")}
        >
          Close
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={remove}
        title="Delete ticket"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
