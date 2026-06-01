"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { PermissionPicker } from "@/components/permissions/permission-picker";
import { RoleBranchPicker } from "@/components/roles/role-branch-picker";
import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";

export function RoleEditDialog({
  role,
  branches,
}: {
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    branchIds: string[];
    isDefault: boolean;
    isActive: boolean;
  };
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isOwner = role.name === "Owner" && role.isDefault;

  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || "");
  const [selected, setSelected] = useState<string[]>(role.permissions);
  const [branchIds, setBranchIds] = useState<string[]>(role.branchIds);
  const [isActive, setIsActive] = useState(role.isActive);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isOwner ? undefined : name,
          description,
          permissions: isOwner ? undefined : selected,
          branchIds,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Role updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role — {role.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Role name" htmlFor="edit-role-name" required>
            <FormInput
              id="edit-role-name"
              value={name}
              disabled={isOwner}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Description" htmlFor="edit-role-desc">
            <FormInput
              id="edit-role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <div>
            <p className="mb-2 text-sm font-medium">Branch access</p>
            <RoleBranchPicker
              branches={branches}
              selected={branchIds}
              onChange={setBranchIds}
            />
          </div>
          {isOwner ? (
            <p className="text-sm text-muted-foreground">
              Owner role has all permissions.
            </p>
          ) : (
            <PermissionPicker selected={selected} onChange={setSelected} />
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isActive}
              onCheckedChange={(c) => setIsActive(c === true)}
            />
            <Label className="font-normal">Active role</Label>
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Role"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RolePermissionList({ permissions }: { permissions: string[] }) {
  return (
    <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
      {permissions.slice(0, 8).map((p) => (
        <li key={p}>
          • {PERMISSION_LABELS[p as Permission] || p}
        </li>
      ))}
      {permissions.length > 8 && <li>…and {permissions.length - 8} more</li>}
    </ul>
  );
}
