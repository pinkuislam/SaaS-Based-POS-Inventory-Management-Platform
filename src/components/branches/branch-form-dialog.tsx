"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { branchFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
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

export function BranchFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      name: "",
      code: "",
      phone: "",
      address: "",
      isMain: false,
    },
    branchFormSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Branch created");
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to create branch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add Branch
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Name"
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
            <FormField label="Code" htmlFor="code" error={fieldError("code")}>
              <FormInput
                id="code"
                name="code"
                value={values.code}
                error={fieldError("code")}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="BR-02"
              />
            </FormField>
          </div>
          <FormField label="Phone" htmlFor="phone" error={fieldError("phone")}>
            <FormInput
              id="phone"
              name="phone"
              value={values.phone}
              error={fieldError("phone")}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </FormField>
          <FormField
            label="Address"
            htmlFor="address"
            error={fieldError("address")}
          >
            <FormInput
              id="address"
              name="address"
              value={values.address}
              error={fieldError("address")}
              onChange={(e) => setField("address", e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.isMain}
              onCheckedChange={(c) => setField("isMain", c === true)}
            />
            <Label className="font-normal">Set as main branch</Label>
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Create Branch"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
