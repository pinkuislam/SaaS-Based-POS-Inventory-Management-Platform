"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { PermissionPicker } from "@/components/permissions/permission-picker";

export function RolePermissionEditor({
  roleId,
  roleName,
  permissions,
  isDefault,
}: {
  roleId: string;
  roleName: string;
  permissions: string[];
  isDefault: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(permissions);

  const isOwner = roleName === "Owner" && isDefault;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Permissions updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (isOwner) {
    return (
      <span className="text-xs text-muted-foreground">All permissions</span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          />
        }
      >
        <Settings2 className="h-3 w-3" />
        Permissions
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissions — {roleName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <PermissionPicker selected={selected} onChange={setSelected} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setSelected(permissions)}
            >
              Reset
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
