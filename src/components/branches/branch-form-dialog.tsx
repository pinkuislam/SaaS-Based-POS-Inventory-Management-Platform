"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { branchFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import {
  BranchFormFields,
  type BranchFormValues,
} from "@/components/branches/branch-form-fields";

const defaultValues: BranchFormValues = {
  name: "",
  code: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  openingBalance: "",
  managerId: "",
  isMain: false,
  isActive: true,
  invoicePrefix: "",
  settingsNotes: "",
};

export function BranchFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    defaultValues,
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
        body: JSON.stringify({
          ...data,
          managerId: data.managerId || null,
          isActive: true,
        }),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <BranchFormFields
            values={values}
            setField={setField}
            fieldError={fieldError}
            showMainToggle
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Create Branch"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
