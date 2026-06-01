"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { accountDeletionRequestSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function AccountDeletionRequest({
  businessName,
}: {
  businessName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    { reason: "", confirmName: "" },
    accountDeletionRequestSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    if (data.confirmName.trim() !== businessName.trim()) {
      notify.error("Business name confirmation does not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[Account deletion request] ${businessName}`,
          message: `The tenant admin has requested permanent deletion of this business account.\n\nReason:\n${data.reason.trim()}\n\nSuper Admin approval is required. The tenant cannot self-delete the account.`,
          priority: "high",
          category: "account_deletion",
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Deletion request submitted to support");
      setSubmitted(true);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Request account deletion
        </CardTitle>
        <CardDescription>
          You cannot permanently delete your business account from this panel.
          Submit a request for Super Admin review. Your data remains until
          approved and processed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Your request was submitted. Our team will contact you at your
            business email before any action is taken.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              label="Reason for deletion"
              htmlFor="del-reason"
              required
              error={fieldError("reason")}
            >
              <FormTextarea
                id="del-reason"
                value={values.reason}
                error={fieldError("reason")}
                onChange={(e) => setField("reason", e.target.value)}
                rows={4}
                placeholder="Please explain why you want to close this account..."
              />
            </FormField>
            <FormField
              label={`Type business name to confirm: "${businessName}"`}
              htmlFor="del-confirm"
              required
              error={fieldError("confirmName")}
            >
              <FormInput
                id="del-confirm"
                value={values.confirmName}
                error={fieldError("confirmName")}
                onChange={(e) => setField("confirmName", e.target.value)}
              />
            </FormField>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Submitting..." : "Submit deletion request"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
