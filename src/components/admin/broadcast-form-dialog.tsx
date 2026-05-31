"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { broadcastSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

type Broadcast = {
  id: string;
  title: string;
  message: string;
  status: string;
};

function buildInitial(broadcast?: Broadcast) {
  return {
    title: broadcast?.title || "",
    message: broadcast?.message || "",
    sendNow: broadcast ? broadcast.status !== "sent" : true,
  };
}

export function BroadcastFormDialog({
  broadcast,
  mode = "create",
}: {
  broadcast?: Broadcast;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSent = broadcast?.status === "sent";
  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm(buildInitial(broadcast), broadcastSchema);

  useEffect(() => {
    if (open) {
      reset(buildInitial(broadcast));
    }
  }, [open, broadcast, reset]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/broadcasts"
          : `/api/admin/broadcasts/${broadcast!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof resData.error === "string" ? resData.error : "Update failed"
        );
      }
      notify.success(
        data.sendNow && !isSent
          ? "Notification sent"
          : mode === "create"
            ? "Draft saved"
            : "Notification updated"
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" ? (
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Send Notification
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <Pencil className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Platform Notification" : "Edit Notification"}
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
            label="Message"
            htmlFor="message"
            required
            error={fe("message")}
          >
            <FormTextarea
              id="message"
              rows={4}
              value={form.message}
              error={fe("message")}
              onChange={(e) => setField("message", e.target.value)}
            />
          </FormField>
          {!isSent && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.sendNow}
                onChange={(e) => setField("sendNow", e.target.checked)}
              />
              Send to all active tenants now
            </label>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {form.sendNow && !isSent ? "Send" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
