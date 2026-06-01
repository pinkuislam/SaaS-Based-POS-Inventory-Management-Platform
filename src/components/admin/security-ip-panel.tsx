"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { securityIpSchema } from "@/lib/schemas/forms";
import { SubmitButton } from "@/components/admin/loading-button";
import { FormField, FormTextarea } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_SETTING_KEYS } from "@/lib/admin/platform-setting-keys";

const initial = {
  ips: "",
};

export function SecurityIpPanel() {
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, setValues } =
    useValidatedForm(initial, securityIpSchema);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) =>
        setValues({
          ips: d[PLATFORM_SETTING_KEYS.adminAllowedIps] || "",
        })
      );
  }, [setValues]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [PLATFORM_SETTING_KEYS.adminAllowedIps]: data.ips,
      }),
    });
    setLoading(false);
    if (res.ok) notify.success("IP rules saved");
    else notify.error("Failed to save");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin IP Restriction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            Leave empty to allow all IPs. One IP per line or comma-separated. Use
            suffix * for ranges (e.g. 192.168.1.*).
          </p>
          <FormField
            label="Allowed IPs"
            htmlFor="ips"
            error={fe("ips")}
          >
            <FormTextarea
              id="ips"
              rows={5}
              value={form.ips}
              error={fe("ips")}
              onChange={(e) => setField("ips", e.target.value)}
              placeholder="127.0.0.1&#10;192.168.1.*"
            />
          </FormField>
          <SubmitButton loading={loading}>Save IP rules</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
