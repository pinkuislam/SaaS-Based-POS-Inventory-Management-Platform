"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { totpCodeSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { ActionButton, SubmitButton } from "@/components/admin/loading-button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Security2faPanel() {
  const [enabled, setEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { values: form, setField, validate, fieldError: fe, reset } =
    useValidatedForm({ code: "" }, totpCodeSchema);

  useEffect(() => {
    fetch("/api/admin/security/2fa")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled));
  }, []);

  async function setup() {
    setLoading(true);
    const res = await fetch("/api/admin/security/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup" }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      notify.success("Scan QR with authenticator app, then enter code to enable");
    } else {
      notify.error("Setup failed");
    }
  }

  async function enable() {
    const data = validate();
    if (!data) return;
    setLoading(true);
    const res = await fetch("/api/admin/security/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enable", code: data.code }),
    });
    setLoading(false);
    if (res.ok) {
      setEnabled(true);
      setQrCode(null);
      setSecret(null);
      reset({ code: "" });
      notify.success("2FA enabled");
    } else {
      notify.error("Invalid code");
    }
  }

  async function disable() {
    const data = validate();
    if (!data) return;
    setLoading(true);
    const res = await fetch("/api/admin/security/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", code: data.code }),
    });
    setLoading(false);
    if (res.ok) {
      setEnabled(false);
      reset({ code: "" });
      notify.success("2FA disabled");
    } else {
      notify.error("Invalid code");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Status: <strong>{enabled ? "Enabled" : "Disabled"}</strong>
        </p>
        {!enabled && !qrCode && (
          <ActionButton onClick={setup} loading={loading} loadingText="Setting up...">
            Set up 2FA
          </ActionButton>
        )}
        {qrCode && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR" className="h-40 w-40 border rounded" />
            {secret && (
              <p className="text-xs font-mono text-muted-foreground break-all">
                Secret: {secret}
              </p>
            )}
          </div>
        )}
        {(qrCode || enabled) && (
          <form
            className="flex flex-wrap items-end gap-3"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (enabled) disable();
              else enable();
            }}
          >
            <FormField
              label="Authenticator code"
              htmlFor="totp-code"
              required
              error={fe("code")}
              className="min-w-[200px]"
            >
              <FormInput
                id="totp-code"
                value={form.code}
                error={fe("code")}
                placeholder="000000"
                maxLength={8}
                onChange={(e) => setField("code", e.target.value)}
              />
            </FormField>
            <SubmitButton
              loading={loading}
              loadingText={enabled ? "Disabling..." : "Enabling..."}
            >
              {enabled ? "Disable 2FA" : "Enable 2FA"}
            </SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
