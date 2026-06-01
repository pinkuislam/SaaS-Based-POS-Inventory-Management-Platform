"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { adminRoleSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

type AdminRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: unknown;
};

function formatPermissions(permissions: unknown) {
  if (!permissions) return "*";
  if (Array.isArray(permissions)) {
    if (permissions.length === 1 && permissions[0] === "*") return "*";
    return permissions.join(", ");
  }
  return "*";
}

function buildInitial(role?: AdminRole) {
  return {
    name: role?.name || "",
    description: role?.description || "",
    permissions: formatPermissions(role?.permissions),
  };
}

export function AdminRoleFormDialog({
  role,
  mode = "create",
}: {
  role?: AdminRole;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(role), adminRoleSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(role));
    }
  }, [open, role, reset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const permissions = (data.permissions || "*")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const res = await fetch(
        mode === "create"
          ? "/api/admin/roles"
          : `/api/admin/roles/${role!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            permissions,
          }),
        }
      );
      if (!res.ok) throw new Error();
      notify.success(mode === "create" ? "Role created" : "Role updated");
      setOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Admin Role" : "Edit Admin Role"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            label="Role Name"
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
            label="Description"
            htmlFor="description"
            error={fe("description")}
          >
            <FormTextarea
              id="description"
              value={form.description}
              error={fe("description")}
              onChange={(e) => setField("description", e.target.value)}
            />
          </FormField>
          <FormField
            label="Permissions (comma-separated, * for all)"
            htmlFor="permissions"
            error={fe("permissions")}
          >
            <FormInput
              id="permissions"
              value={form.permissions}
              error={fe("permissions")}
              onChange={(e) => setField("permissions", e.target.value)}
            />
          </FormField>
          <SubmitButton loading={loading} className="w-full">
            Save
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
