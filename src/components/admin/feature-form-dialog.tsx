"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { featureSchema } from "@/lib/schemas/forms";
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
}: {
  feature?: Feature;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Feature" : "Edit Feature"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
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
          <Button type="submit" className="w-full" disabled={loading}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
