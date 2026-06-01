"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function RoleDeleteButton({
  roleId,
  roleName,
  userCount,
  isDefault,
}: {
  roleId: string;
  roleName: string;
  userCount: number;
  isDefault: boolean;
}) {
  const router = useRouter();

  if (isDefault) return null;

  async function handleDelete() {
    const ok = await confirmDelete(
      userCount > 0
        ? `Cannot delete — ${userCount} user(s) assigned to "${roleName}".`
        : `Delete role "${roleName}"?`
    );
    if (!ok || userCount > 0) return;

    const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      notify.error(data.error || "Delete failed");
      return;
    }
    notify.success("Role deleted");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive"
      onClick={handleDelete}
      title="Delete role"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
