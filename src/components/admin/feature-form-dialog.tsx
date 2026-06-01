"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { featureSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import { DialogActionOverlay } from "@/components/admin/dialog-action-overlay";
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
import { Plus, Pencil } from "lucide-react";

type Feature = {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

function buildInitial(feature?: Feature) {
  return {
    key: feature?.key || "",
    name: feature?.name || "",
    module: feature?.module || "General",
    description: feature?.description || "",
    isActive: feature?.isActive ?? true,
    sortOrder: String(feature?.sortOrder ?? 0),
  };
}

export function FeatureFormDialog({
  feature,
  mode = "create",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  feature?: Feature;
  mode?: "create" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe } = useValidatedForm(
    buildInitial(feature),
    featureSchema
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const payload = {
      key: data.key,
      name: data.name,
      module: data.module || "General",
      description: data.description,
      isActive: data.isActive ?? true,
      sortOrder: parseInt(data.sortOrder || "0", 10),
    };
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/features"
          : `/api/admin/features/${feature!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      notify.success(mode === "create" ? "Feature created" : "Feature updated");
      setOpen(false);
      router.refresh();
    } catch {
      notify.error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) setOpen(next);
      }}
    >
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </DialogTrigger>
      ) : controlledOpen === undefined ? (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      ) : null}
      <DialogContent className="relative">
        <DialogActionOverlay loading={loading} />
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Feature" : "Edit Feature"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <fieldset disabled={loading} className="space-y-4 border-0 p-0 m-0 min-w-0">
          <FormField
            label="Feature Key"
            htmlFor="key"
            required
            error={fe("key")}
          >
            <FormInput
              id="key"
              disabled={mode === "edit"}
              value={form.key}
              error={fe("key")}
              onChange={(e) => setField("key", e.target.value)}
            />
          </FormField>
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
          <FormField label="Module" htmlFor="module" error={fe("module")}>
            <FormInput
              id="module"
              value={form.module}
              error={fe("module")}
              onChange={(e) => setField("module", e.target.value)}
            />
          </FormField>
          <FormField
            label="Description"
            htmlFor="description"
            error={fe("description")}
          >
            <FormInput
              id="description"
              value={form.description}
              error={fe("description")}
              onChange={(e) => setField("description", e.target.value)}
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(v) => setField("isActive", !!v)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          </fieldset>
          <SubmitButton
            loading={loading}
            loadingText={mode === "create" ? "Creating..." : "Updating..."}
            className="w-full"
          >
            {mode === "create" ? "Create Feature" : "Update Feature"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
