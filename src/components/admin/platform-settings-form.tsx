"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { platformSettingsSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/admin/loading-button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_SETTING_KEYS } from "@/lib/admin/platform-setting-keys";
import { PaymentSettingsForm } from "./payment-settings-form";

const K = PLATFORM_SETTING_KEYS;

const initial = {
  [K.platformName]: "InventoryPOS",
  [K.platformEmail]: "",
  [K.supportEmail]: "",
  [K.currency]: "BDT",
  [K.timezone]: "Asia/Dhaka",
  [K.dateFormat]: "dd/MM/yyyy",
  [K.defaultTrialDays]: "14",
  [K.defaultGraceDays]: "7",
  [K.sessionTimeout]: "480",
  [K.passwordMinLength]: "8",
  [K.termsUrl]: "",
  [K.privacyUrl]: "",
};

export function PlatformSettingsForm() {
  const [loading, setLoading] = useState(false);
  const { values: form, setField, validate, fieldError: fe, setValues } =
    useValidatedForm(initial, platformSettingsSchema);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setValues((f) => ({ ...f, ...data })))
      .catch(() => {});
  }, [setValues]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      notify.success("Settings saved");
    } catch {
      notify.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Platform Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Platform Name"
              htmlFor={K.platformName}
              required
              error={fe(K.platformName)}
            >
              <FormInput
                id={K.platformName}
                value={form[K.platformName]}
                error={fe(K.platformName)}
                onChange={(e) => setField(K.platformName, e.target.value)}
              />
            </FormField>
            <FormField
              label="Platform Email"
              htmlFor={K.platformEmail}
              error={fe(K.platformEmail)}
            >
              <FormInput
                id={K.platformEmail}
                type="email"
                value={form[K.platformEmail]}
                error={fe(K.platformEmail)}
                onChange={(e) => setField(K.platformEmail, e.target.value)}
              />
            </FormField>
            <FormField
              label="Support Email"
              htmlFor={K.supportEmail}
              error={fe(K.supportEmail)}
            >
              <FormInput
                id={K.supportEmail}
                type="email"
                value={form[K.supportEmail]}
                error={fe(K.supportEmail)}
                onChange={(e) => setField(K.supportEmail, e.target.value)}
              />
            </FormField>
            <FormField
              label="Currency"
              htmlFor={K.currency}
              required
              error={fe(K.currency)}
            >
              <FormInput
                id={K.currency}
                value={form[K.currency]}
                error={fe(K.currency)}
                onChange={(e) => setField(K.currency, e.target.value)}
              />
            </FormField>
            <FormField
              label="Timezone"
              htmlFor={K.timezone}
              required
              error={fe(K.timezone)}
            >
              <FormInput
                id={K.timezone}
                value={form[K.timezone]}
                error={fe(K.timezone)}
                onChange={(e) => setField(K.timezone, e.target.value)}
              />
            </FormField>
            <FormField
              label="Date Format"
              htmlFor={K.dateFormat}
              required
              error={fe(K.dateFormat)}
            >
              <FormInput
                id={K.dateFormat}
                value={form[K.dateFormat]}
                error={fe(K.dateFormat)}
                onChange={(e) => setField(K.dateFormat, e.target.value)}
              />
            </FormField>
            <FormField
              label="Default Trial Days"
              htmlFor={K.defaultTrialDays}
              error={fe(K.defaultTrialDays)}
            >
              <FormInput
                id={K.defaultTrialDays}
                type="number"
                value={form[K.defaultTrialDays]}
                error={fe(K.defaultTrialDays)}
                onChange={(e) => setField(K.defaultTrialDays, e.target.value)}
              />
            </FormField>
            <FormField
              label="Default Grace Days"
              htmlFor={K.defaultGraceDays}
              error={fe(K.defaultGraceDays)}
            >
              <FormInput
                id={K.defaultGraceDays}
                type="number"
                value={form[K.defaultGraceDays]}
                error={fe(K.defaultGraceDays)}
                onChange={(e) => setField(K.defaultGraceDays, e.target.value)}
              />
            </FormField>
            <FormField
              label="Session Timeout (minutes)"
              htmlFor={K.sessionTimeout}
              error={fe(K.sessionTimeout)}
            >
              <FormInput
                id={K.sessionTimeout}
                type="number"
                value={form[K.sessionTimeout]}
                error={fe(K.sessionTimeout)}
                onChange={(e) => setField(K.sessionTimeout, e.target.value)}
              />
            </FormField>
            <FormField
              label="Min Password Length"
              htmlFor={K.passwordMinLength}
              error={fe(K.passwordMinLength)}
            >
              <FormInput
                id={K.passwordMinLength}
                type="number"
                value={form[K.passwordMinLength]}
                error={fe(K.passwordMinLength)}
                onChange={(e) => setField(K.passwordMinLength, e.target.value)}
              />
            </FormField>
            <FormField
              label="Terms URL"
              htmlFor={K.termsUrl}
              className="md:col-span-2"
              error={fe(K.termsUrl)}
            >
              <FormInput
                id={K.termsUrl}
                value={form[K.termsUrl]}
                error={fe(K.termsUrl)}
                onChange={(e) => setField(K.termsUrl, e.target.value)}
              />
            </FormField>
            <FormField
              label="Privacy URL"
              htmlFor={K.privacyUrl}
              className="md:col-span-2"
              error={fe(K.privacyUrl)}
            >
              <FormInput
                id={K.privacyUrl}
                value={form[K.privacyUrl]}
                error={fe(K.privacyUrl)}
                onChange={(e) => setField(K.privacyUrl, e.target.value)}
              />
            </FormField>
            <SubmitButton loading={loading} className="md:col-span-2">
              Save Platform Settings
            </SubmitButton>
          </CardContent>
        </Card>
      </form>
      <PaymentSettingsForm />
    </div>
  );
}
