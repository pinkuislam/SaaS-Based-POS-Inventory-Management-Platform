"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, UserX, RotateCcw } from "lucide-react";
import { PermissionPicker } from "@/components/permissions/permission-picker";

interface Option {
  id: string;
  name: string;
}

export function UserEditDialog({
  user,
  roles,
  branches,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    roleId: string | null;
    branchId: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    extraPermissions?: string[];
  };
  roles: Option[];
  branches: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDeleted = !!user.deletedAt;

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [roleId, setRoleId] = useState(user.roleId || "");
  const [branchId, setBranchId] = useState(user.branchId || "");
  const [isActive, setIsActive] = useState(user.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [forcePasswordReset, setForcePasswordReset] = useState(false);
  const [extraPermissions, setExtraPermissions] = useState<string[]>(
    user.extraPermissions || []
  );
  const [showPermissions, setShowPermissions] = useState(
    (user.extraPermissions?.length ?? 0) > 0
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          roleId: roleId || null,
          branchId: branchId || null,
          isActive,
          extraPermissions,
          ...(newPassword ? { password: newPassword } : {}),
          forcePasswordReset:
            newPassword ? forcePasswordReset : forcePasswordReset,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("User updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOrDeactivate() {
    const ok = await confirmDelete(
      "Delete or deactivate this user? Users with sales/purchase history will only be deactivated."
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(data.message || "User removed");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(data.message || "User restored");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        {isDeleted ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This user was deleted. Restore to allow sign-in again.
            </p>
            <Button onClick={handleRestore} disabled={loading} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore User
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <FormField label="Name" htmlFor="edit-name" required>
              <FormInput
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField label="Email" htmlFor="edit-email" required>
              <FormInput
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField label="Phone" htmlFor="edit-phone">
              <FormInput
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormSelect2
              label="Role"
              value={roleId}
              onChange={setRoleId}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Select role"
            />
            <FormSelect2
              label="Branch"
              value={branchId}
              onChange={setBranchId}
              options={[
                { value: "", label: "No branch" },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <FormField label="New password" htmlFor="edit-password">
              <FormInput
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>
            <div className="flex items-center gap-2">
              <Checkbox
                id="force-reset"
                checked={forcePasswordReset}
                onCheckedChange={(c) => setForcePasswordReset(c === true)}
              />
              <Label htmlFor="force-reset">
                Require password change on next login
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={isActive}
                onCheckedChange={(c) => setIsActive(c === true)}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPermissions((s) => !s)}
              >
                {showPermissions ? "Hide" : "Edit"} extra permissions
              </Button>
              {showPermissions ? (
                <div className="mt-3">
                  <PermissionPicker
                    selected={extraPermissions}
                    onChange={setExtraPermissions}
                  />
                </div>
              ) : null}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteOrDeactivate}
                disabled={loading}
              >
                <UserX className="mr-1 h-4 w-4" />
                Delete / Deactivate
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
