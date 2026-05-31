"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import {
  validateWithSchema,
  type FieldErrors,
} from "@/lib/validate-form";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

export function CrudFormDialog({
  title,
  triggerLabel,
  mode = "create",
  apiUrl,
  method,
  onSubmitBody,
  schema,
  children,
  onSuccess,
}: {
  title: string;
  triggerLabel?: string;
  mode?: "create" | "edit";
  apiUrl: string;
  method: "POST" | "PATCH";
  onSubmitBody: () => Record<string, unknown>;
  schema?: ZodType;
  children: (props: {
    form: Record<string, string>;
    setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    errors: FieldErrors;
    clearError: (field: string) => void;
  }) => ReactNode;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const body = onSubmitBody();
    if (schema) {
      const parsed = validateWithSchema(schema, body);
      if (!parsed.success) {
        setErrors(parsed.errors);
        notify.error("Please fix the errors below");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      notify.success(mode === "create" ? "Created successfully" : "Updated successfully");
      setOpen(false);
      setErrors({});
      onSuccess?.();
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
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel || "Add"}
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {children({ form, setForm, errors, clearError })}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
