"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { userSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

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

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      name: "",
      email: "",
      password: "",
      phone: "",
      roleId: "",
      branchId: "",
    },
    userSchema
  );

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
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
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("User created");
      setOpen(false);
      reset();
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
      <DialogContent>
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
              name="name"
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
              name="email"
              type="email"
              value={values.email}
              error={fieldError("email")}
              onChange={(e) => setField("email", e.target.value)}
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
              name="password"
              type="password"
              value={values.password}
              error={fieldError("password")}
              onChange={(e) => setField("password", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect2
              label="Role"
              htmlFor="roleId"
              required
              options={roleOptions}
              value={values.roleId}
              onChange={(v) => setField("roleId", v)}
              placeholder="Select role"
              error={fieldError("roleId")}
            />
            <FormSelect2
              label="Branch"
              htmlFor="branchId"
              options={branchOptions}
              value={values.branchId}
              onChange={(v) => setField("branchId", v)}
              placeholder="Select branch"
              error={fieldError("branchId")}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
