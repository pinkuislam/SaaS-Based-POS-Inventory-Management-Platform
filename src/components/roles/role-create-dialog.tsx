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
import { Plus } from "lucide-react";
import { PermissionPicker } from "@/components/permissions/permission-picker";
import { RoleBranchPicker } from "@/components/roles/role-branch-picker";
import { PERMISSIONS } from "@/lib/permissions";

export function RoleCreateDialog({
  branches,
}: {
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.MANAGE_POS,
  ]);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      notify.error("Role name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          permissions: selected,
          branchIds,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Role created");
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Add Role
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Role name" htmlFor="role-name" required>
            <FormInput
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Store Supervisor"
            />
          </FormField>
          <FormField label="Description" htmlFor="role-desc">
            <FormInput
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
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
          <PermissionPicker selected={selected} onChange={setSelected} />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isActive}
              onCheckedChange={(c) => setIsActive(c === true)}
            />
            <Label className="font-normal">Active role</Label>
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Role"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
