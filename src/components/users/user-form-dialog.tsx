"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { userSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
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
import { Plus } from "lucide-react";
import { PermissionPicker } from "@/components/permissions/permission-picker";
import { z } from "zod";

const createUserSchema = userSchema.extend({
  isActive: z.boolean().optional(),
});

interface Option {
  id: string;
  name: string;
}

export function UserFormDialog({
  roles,
  branches,
}: {
  roles: Option[];
  branches: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extraPermissions, setExtraPermissions] = useState<string[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      name: "",
      email: "",
      password: "",
      phone: "",
      roleId: "",
      branchId: "",
      isActive: true,
    },
    createUserSchema
  );

  const roleOptions = roles
    .filter((r) => r.name)
    .map((r) => ({ value: r.id, label: r.name }));
  const branchOptions = [
    { value: "", label: "No branch" },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          roleId: data.roleId || null,
          branchId: data.branchId || null,
          extraPermissions,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("User created");
      setOpen(false);
      reset();
      setExtraPermissions([]);
      setShowPermissions(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add User
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Full Name"
            htmlFor="name"
            required
            error={fieldError("name")}
          >
            <FormInput
              id="name"
              value={values.name}
              error={fieldError("name")}
              onChange={(e) => setField("name", e.target.value)}
            />
          </FormField>
          <FormField
            label="Email"
            htmlFor="email"
            required
            error={fieldError("email")}
          >
            <FormInput
              id="email"
              type="email"
              value={values.email}
              error={fieldError("email")}
              onChange={(e) => setField("email", e.target.value)}
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone">
            <FormInput
              id="phone"
              value={values.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </FormField>
          <FormField
            label="Password"
            htmlFor="password"
            required
            error={fieldError("password")}
          >
            <FormInput
              id="password"
              type="password"
              value={values.password}
              error={fieldError("password")}
              onChange={(e) => setField("password", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect2
              label="Role"
              required
              options={roleOptions}
              value={values.roleId}
              onChange={(v) => setField("roleId", v)}
              placeholder="Select role"
              error={fieldError("roleId")}
            />
            <FormSelect2
              label="Branch"
              options={branchOptions}
              value={values.branchId}
              onChange={(v) => setField("branchId", v)}
              placeholder="Select branch"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.isActive}
              onCheckedChange={(c) => setField("isActive", c === true)}
            />
            <Label className="font-normal">Active user</Label>
          </label>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPermissions((s) => !s)}
            >
              {showPermissions ? "Hide" : "Set"} extra permissions
            </Button>
            {showPermissions ? (
              <div className="mt-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Additional permissions on top of the assigned role
                </p>
                <PermissionPicker
                  selected={extraPermissions}
                  onChange={setExtraPermissions}
                />
              </div>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
