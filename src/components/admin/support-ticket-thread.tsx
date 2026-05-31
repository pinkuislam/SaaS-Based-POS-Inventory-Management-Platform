"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { supportReplySchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea, FormSelect2 } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Reply = {
  id: string;
  authorType: string;
  authorName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const replyInitial = {
  message: "",
};

export function SupportTicketThread({
  ticket,
  admins,
}: {
  ticket: {
    id: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    category: string | null;
    createdAt: string;
    tenant: { name: string };
    assignedAdminId: string | null;
    replies: Reply[];
  };
  admins: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [internal, setInternal] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedAdminId, setAssignedAdminId] = useState(
    ticket.assignedAdminId || ""
  );
  const [loading, setLoading] = useState(false);
  const { values: replyForm, setField, validate, fieldError: fe, reset } =
    useValidatedForm(replyInitial, supportReplySchema);

  const adminOptions = [
    { value: "", label: "Unassigned" },
    ...admins.map((a) => ({ value: a.id, label: a.name })),
  ];

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const res = await fetch(`/api/admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: data.message.trim(),
        isInternal: internal,
        status,
        priority,
        assignedAdminId: assignedAdminId || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      notify.success("Reply sent");
      reset();
      setInternal(false);
      router.refresh();
    } else notify.error("Failed to send");
  }

  const allMessages = [
    {
      id: "initial",
      authorName: ticket.tenant.name,
      authorType: "tenant",
      message: ticket.message,
      isInternal: false,
      createdAt: ticket.createdAt,
    },
    ...ticket.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge>{status}</Badge>
        <Badge variant="outline">{priority}</Badge>
        {ticket.category && <Badge variant="secondary">{ticket.category}</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormSelect2
          label="Status"
          htmlFor="status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          searchable={false}
        />
        <FormSelect2
          label="Priority"
          htmlFor="priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
          searchable={false}
        />
        <FormSelect2
          label="Assigned to"
          htmlFor="assignedAdminId"
          options={adminOptions}
          value={assignedAdminId}
          onChange={setAssignedAdminId}
          placeholder="Unassigned"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {allMessages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg border p-4 ${
                m.isInternal ? "bg-muted/50 border-dashed" : ""
              }`}
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">
                  {m.authorName}{" "}
                  <span className="text-muted-foreground">({m.authorType})</span>
                  {m.isInternal && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Internal
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground">
                  {formatDate(m.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reply</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitReply} className="space-y-4" noValidate>
            <FormField
              label="Message"
              htmlFor="message"
              required
              error={fe("message")}
            >
              <FormTextarea
                id="message"
                rows={4}
                value={replyForm.message}
                error={fe("message")}
                onChange={(e) => setField("message", e.target.value)}
                placeholder="Write a reply..."
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
              />
              Internal note (not visible to tenant)
            </label>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reply & update"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
