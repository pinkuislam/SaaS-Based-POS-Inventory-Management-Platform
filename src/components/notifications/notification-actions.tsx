"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NotificationActions() {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={markAllRead}>
      Mark all as read
    </Button>
  );
}
