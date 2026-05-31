"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
      toast.success(`Ticket marked ${newStatus}`);
      router.refresh();
    } else {
      toast.error("Update failed");
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
    </div>
  );
}
