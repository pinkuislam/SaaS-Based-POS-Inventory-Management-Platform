"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
} from "@/lib/schemas/admin-user";
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
import { Plus, Pencil } from "lucide-react";

type Admin = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleId: string | null;
  isActive: boolean;
};

function buildInitial(admin?: Admin) {
  return {
    name: admin?.name || "",
    email: admin?.email || "",
    phone: admin?.phone || "",
    password: "",
    roleId: admin?.roleId || "",
    isActive: admin?.isActive ?? true,
  };
}

export function AdminUserFormDialog({
  roles,
  admin,
  mode = "create",
}: {
  roles: { id: string; name: string }[];
  admin?: Admin;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const schema =
    mode === "create" ? adminUserCreateSchema : adminUserUpdateSchema;

  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(admin), schema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(admin));
    }
  }, [open, admin, reset]);

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        roleId: data.roleId,
      };
      if (mode === "edit") {
        payload.isActive = form.isActive;
        if (data.password) payload.password = data.password;
      } else {
        payload.password = data.password;
      }

      const res = await fetch(
        mode === "create" ? "/api/admin/admins" : `/api/admin/admins/${admin!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      notify.success(
        mode === "create" ? "Admin user created successfully" : "Admin user updated"
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Admin User" : "Edit Admin User"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            label="Name"
            htmlFor="name"
            required
            error={fe("name")}
          >
            <FormInput
              id="name"
              value={form.name}
              error={fe("name")}
              onChange={(e) => setField("name", e.target.value)}
            />
          </FormField>
          <FormField
            label="Email"
            htmlFor="email"
            required
            error={fe("email")}
          >
            <FormInput
              id="email"
              type="email"
              value={form.email}
              error={fe("email")}
              onChange={(e) => setField("email", e.target.value)}
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={fe("phone")}>
            <FormInput
              id="phone"
              value={form.phone}
              error={fe("phone")}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </FormField>
          <FormField
            label={mode === "edit" ? "New Password (optional)" : "Password"}
            htmlFor="password"
            required={mode === "create"}
            error={fe("password")}
          >
            <FormInput
              id="password"
              type="password"
              value={form.password}
              error={fe("password")}
              onChange={(e) => setField("password", e.target.value)}
            />
          </FormField>
          <FormSelect2
            label="Role"
            required
            options={roleOptions}
            value={form.roleId}
            onChange={(v) => setField("roleId", v)}
            placeholder="Select role"
            error={fe("roleId")}
          />
          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setField("isActive", !!v)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
