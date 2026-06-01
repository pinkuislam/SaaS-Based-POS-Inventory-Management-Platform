"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { announcementSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect2,
} from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

const TARGET_OPTIONS = [
  { value: "all", label: "All tenants" },
  { value: "active", label: "Active tenants only" },
  { value: "trial", label: "Trial tenants only" },
];

type Announcement = {
  id: string;
  title: string;
  content: string;
  targetType: string;
  status: string;
};

function buildInitial(announcement?: Announcement) {
  return {
    title: announcement?.title || "",
    body: announcement?.content || "",
    target: announcement?.targetType || "all",
    publish: announcement?.status === "published",
  };
}

export function AnnouncementFormDialog({
  announcement,
  mode = "create",
}: {
  announcement?: Announcement;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(announcement), announcementSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(announcement));
    }
  }, [open, announcement, reset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const payload = {
      title: data.title,
      content: data.body,
      targetType: data.target,
      status: data.publish ? "published" : "draft",
    };
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/announcements"
          : `/api/admin/announcements/${announcement!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      notify.success(
        mode === "create" ? "Announcement created" : "Announcement updated"
      );
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
          New Announcement
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Announcement" : "Edit Announcement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            label="Title"
            htmlFor="title"
            required
            error={fe("title")}
          >
            <FormInput
              id="title"
              value={form.title}
              error={fe("title")}
              onChange={(e) => setField("title", e.target.value)}
            />
          </FormField>
          <FormField
            label="Content"
            htmlFor="body"
            required
            error={fe("body")}
          >
            <FormTextarea
              id="body"
              rows={5}
              value={form.body}
              error={fe("body")}
              onChange={(e) => setField("body", e.target.value)}
            />
          </FormField>
          <FormSelect2
            label="Target"
            htmlFor="target"
            required
            error={fe("target")}
            options={TARGET_OPTIONS}
            value={form.target}
            onChange={(v) => setField("target", v)}
            searchable={false}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.publish}
              onChange={(e) => setField("publish", e.target.checked)}
            />
            Publish immediately
          </label>
          <SubmitButton loading={loading} className="w-full">
            Save
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
