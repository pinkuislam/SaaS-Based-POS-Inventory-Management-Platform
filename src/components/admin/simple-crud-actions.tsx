"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Trash2 } from "lucide-react";
import { ActionButton, ActionIconButton } from "@/components/admin/loading-button";

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
  const [loading, setLoading] = useState(false);

  async function remove() {
    const confirmed = await confirmDelete(confirmTitle, confirmMessage);
    if (!confirmed) return;

    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionIconButton
      size="icon"
      variant="ghost"
      loading={loading}
      onClick={remove}
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </ActionIconButton>
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
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton
      size="sm"
      variant="outline"
      loading={loading}
      loadingText="Updating..."
      onClick={toggle}
    >
      {label}
    </ActionButton>
  );
}
