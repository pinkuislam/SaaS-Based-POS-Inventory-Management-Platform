"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { supportTicketSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect2,
} from "@/components/ui/form-field";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function SupportTicketForm() {
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      subject: "",
      message: "",
      priority: "medium",
    },
    supportTicketSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Support ticket submitted");
      reset({ subject: "", message: "", priority: "medium" });
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="Subject"
        htmlFor="subject"
        required
        error={fieldError("subject")}
      >
        <FormInput
          id="subject"
          name="subject"
          value={values.subject}
          error={fieldError("subject")}
          onChange={(e) => setField("subject", e.target.value)}
        />
      </FormField>
      <FormSelect2
        label="Priority"
        htmlFor="priority"
        options={PRIORITY_OPTIONS}
        value={values.priority || "medium"}
        onChange={(v) => setField("priority", v)}
        error={fieldError("priority")}
      />
      <FormField
        label="Message"
        htmlFor="message"
        required
        error={fieldError("message")}
      >
        <FormTextarea
          id="message"
          name="message"
          value={values.message}
          error={fieldError("message")}
          onChange={(e) => setField("message", e.target.value)}
          rows={4}
        />
      </FormField>
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  );
}
