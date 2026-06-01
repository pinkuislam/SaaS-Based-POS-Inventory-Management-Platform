"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { smtpSettingsSchema, smtpTestSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const initial = {
  smtpEnabled: true,
  smtpHost: "",
  smtpPort: "587",
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
};

export function SmtpSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { values: form, setField, validate, fieldError: fe, setValues } =
    useValidatedForm(initial, smtpSettingsSchema);

  useEffect(() => {
    fetch("/api/admin/smtp-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setConfigured(!!data.configured);
        setValues({
          smtpEnabled: data.smtpEnabled !== false,
          smtpHost: data.smtpHost || "",
          smtpPort: data.smtpPort || "587",
          smtpSecure: !!data.smtpSecure,
          smtpUser: data.smtpUser || "",
          smtpPass: data.smtpPass === "••••••••" ? "" : data.smtpPass || "",
          smtpFrom: data.smtpFrom || "",
        });
      })
      .catch(() => {});
  }, [setValues]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/smtp-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setConfigured(!!json.configured);
      notify.success("SMTP settings saved");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    const parsed = smtpTestSchema.safeParse({ testEmail });
    if (!parsed.success) {
      notify.error(parsed.error.issues[0]?.message || "Invalid email");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/admin/smtp-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Test failed");
      notify.success(`Test email sent to ${testEmail}`);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>SMTP / Email</CardTitle>
            <CardDescription>
              Platform outbound email for invoices, alerts, and password resets
            </CardDescription>
          </div>
          <Badge variant={configured ? "default" : "secondary"}>
            {configured ? "Configured" : "Not configured"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.smtpEnabled}
              onCheckedChange={(c) => setField("smtpEnabled", c === true)}
            />
            Enable SMTP
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="SMTP Host"
              htmlFor="smtpHost"
              required
              error={fe("smtpHost")}
            >
              <FormInput
                id="smtpHost"
                value={form.smtpHost}
                error={fe("smtpHost")}
                onChange={(e) => setField("smtpHost", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </FormField>
            <FormField
              label="Port"
              htmlFor="smtpPort"
              required
              error={fe("smtpPort")}
            >
              <FormInput
                id="smtpPort"
                type="number"
                value={form.smtpPort}
                error={fe("smtpPort")}
                onChange={(e) => setField("smtpPort", e.target.value)}
              />
            </FormField>
            <FormField
              label="Username"
              htmlFor="smtpUser"
              required
              error={fe("smtpUser")}
            >
              <FormInput
                id="smtpUser"
                value={form.smtpUser}
                error={fe("smtpUser")}
                onChange={(e) => setField("smtpUser", e.target.value)}
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor="smtpPass"
              error={fe("smtpPass")}
              description="Leave blank to keep existing password"
            >
              <FormInput
                id="smtpPass"
                type="password"
                value={form.smtpPass}
                error={fe("smtpPass")}
                onChange={(e) => setField("smtpPass", e.target.value)}
              />
            </FormField>
            <FormField
              label="From Address"
              htmlFor="smtpFrom"
              error={fe("smtpFrom")}
              className="md:col-span-2"
            >
              <FormInput
                id="smtpFrom"
                type="email"
                value={form.smtpFrom}
                error={fe("smtpFrom")}
                onChange={(e) => setField("smtpFrom", e.target.value)}
                placeholder="noreply@yourplatform.com"
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.smtpSecure}
              onCheckedChange={(c) => setField("smtpSecure", c === true)}
            />
            Use TLS/SSL (port 465)
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <SubmitButton loading={loading}>
              Save SMTP Settings
            </SubmitButton>
          </div>
        </form>

        <div className="mt-6 border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Send test email</p>
          <div className="flex flex-wrap gap-2">
            <FormInput
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              disabled={testing}
              onClick={handleTest}
            >
              {testing ? "Sending..." : "Send test"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Save settings before testing. Environment variables (SMTP_HOST, etc.)
            are used when database settings are empty.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
