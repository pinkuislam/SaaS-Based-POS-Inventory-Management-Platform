"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  url,
  confirmMessage = "Delete this item?",
  confirmTitle = "Are you sure?",
  successMessage = "Deleted successfully",
}: {
  url: string;
  confirmMessage?: string;
  confirmTitle?: string;
  successMessage?: string;
}) {
  const router = useRouter();

  async function remove() {
    const confirmed = await confirmDelete(confirmTitle, confirmMessage);
    if (!confirmed) return;

    const res = await fetch(url, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) {
      notify.success(successMessage);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      const fallback =
        res.status === 401
          ? "Session expired — sign in again"
          : res.status === 403
            ? "Not allowed"
            : "Delete failed";
      notify.error(
        typeof data.error === "string" ? data.error : fallback
      );
    }
  }

  return (
    <Button size="icon" variant="ghost" onClick={remove}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

export function StatusToggleButton({
  url,
  field,
  value,
  label,
}: {
  url: string;
  field: string;
  value: string;
  label: string;
}) {
  const router = useRouter();

  async function toggle() {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      notify.success("Updated successfully");
      router.refresh();
    } else {
      notify.error("Update failed");
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle}>
      {label}
    </Button>
  );
}
