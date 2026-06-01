"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
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
import { Pencil, Archive, RotateCcw } from "lucide-react";
import {
  BranchFormFields,
  type BranchFormValues,
} from "@/components/branches/branch-form-fields";
import type { BranchSettings } from "@/lib/branches";

export function BranchEditDialog({
  branch,
}: {
  branch: {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    openingBalance: number | null;
    managerId: string | null;
    isMain: boolean;
    isActive: boolean;
    deletedAt: string | null;
    settings?: BranchSettings;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDeleted = !!branch.deletedAt;

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      name: branch.name,
      code: branch.code || "",
      contactPerson: branch.contactPerson || "",
      phone: branch.phone || "",
      email: branch.email || "",
      address: branch.address || "",
      openingBalance:
        branch.openingBalance != null ? String(branch.openingBalance) : "",
      managerId: branch.managerId || "",
      isMain: branch.isMain,
      isActive: branch.isActive,
      invoicePrefix: branch.settings?.invoicePrefix || "",
      settingsNotes: branch.settings?.notes || "",
    } satisfies BranchFormValues,
    branchFormSchema
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          managerId: data.managerId || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Branch updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleArchiveOrDelete() {
    const ok = await confirmDelete(
      "Archive or delete this branch? Branches with transaction history will be archived only."
    );
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(data.message || (data.archived ? "Branch archived" : "Branch deleted"));
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
      const res = await fetch(`/api/branches/${branch.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(data.message || "Branch restored");
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
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        {isDeleted ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This branch was deleted. Restore it to edit or use again.
            </p>
            <Button onClick={handleRestore} disabled={loading} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              {loading ? "Restoring..." : "Restore Branch"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <BranchFormFields
              values={values}
              setField={setField}
              fieldError={fieldError}
              showMainToggle={!branch.isMain}
              showStatusToggle
            />
            <div className="flex justify-between pt-2">
              {!branch.isMain ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleArchiveOrDelete}
                  disabled={loading}
                >
                  <Archive className="mr-1 h-4 w-4" />
                  Archive / Delete
                </Button>
              ) : null}
              <Button type="submit" disabled={loading} className="ml-auto">
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
