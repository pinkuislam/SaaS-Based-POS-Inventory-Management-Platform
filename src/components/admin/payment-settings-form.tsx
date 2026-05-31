"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { paymentSettingsSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
const STRIPE_WEBHOOK_PATH = "/api/webhooks/stripe";

const GATEWAY_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "sslcommerz", label: "SSLCommerz" },
];

const initial = {
  stripeEnabled: false,
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  sslcommerzEnabled: false,
  sslcommerzStoreId: "",
  sslcommerzStorePass: "",
  sslcommerzSandbox: true,
  defaultGateway: "stripe",
};

export function PaymentSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    `Webhook URL: ${STRIPE_WEBHOOK_PATH}`
  );
  const { values: form, setField, validate, fieldError: fe, setValues } =
    useValidatedForm(initial, paymentSettingsSchema);

  useEffect(() => {
    setWebhookUrl(`Webhook URL: ${window.location.origin}${STRIPE_WEBHOOK_PATH}`);
  }, []);

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setValues({
          stripeEnabled: data.stripeEnabled,
          stripePublishableKey: data.stripePublishableKey || "",
          stripeSecretKey: "",
          stripeWebhookSecret:
            data.stripeWebhookSecret === "••••••••"
              ? ""
              : data.stripeWebhookSecret || "",
          sslcommerzEnabled: data.sslcommerzEnabled,
          sslcommerzStoreId: data.sslcommerzStoreId || "",
          sslcommerzStorePass: "",
          sslcommerzSandbox: data.sslcommerzSandbox !== false,
          defaultGateway: data.defaultGateway || "stripe",
        });
      });
  }, [setValues]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      notify.success("Payment settings saved");
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>International card payments (USD)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.stripeEnabled}
              onCheckedChange={(c) => setField("stripeEnabled", c === true)}
            />
            Enable Stripe
          </label>
          <FormField
            label="Publishable Key"
            htmlFor="stripePublishableKey"
            error={fe("stripePublishableKey")}
          >
            <FormInput
              id="stripePublishableKey"
              value={form.stripePublishableKey}
              error={fe("stripePublishableKey")}
              onChange={(e) => setField("stripePublishableKey", e.target.value)}
              placeholder="pk_test_..."
            />
          </FormField>
          <FormField
            label="Secret Key"
            htmlFor="stripeSecretKey"
            error={fe("stripeSecretKey")}
          >
            <FormInput
              id="stripeSecretKey"
              type="password"
              value={form.stripeSecretKey}
              error={fe("stripeSecretKey")}
              onChange={(e) => setField("stripeSecretKey", e.target.value)}
              placeholder="sk_test_... (leave blank to keep)"
            />
          </FormField>
          <FormField
            label="Webhook Secret"
            htmlFor="stripeWebhookSecret"
            error={fe("stripeWebhookSecret")}
            description={webhookUrl}
          >
            <FormInput
              id="stripeWebhookSecret"
              type="password"
              value={form.stripeWebhookSecret}
              error={fe("stripeWebhookSecret")}
              onChange={(e) => setField("stripeWebhookSecret", e.target.value)}
              placeholder="whsec_..."
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SSLCommerz</CardTitle>
          <CardDescription>Bangladesh mobile banking & cards (BDT)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.sslcommerzEnabled}
              onCheckedChange={(c) => setField("sslcommerzEnabled", c === true)}
            />
            Enable SSLCommerz
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              label="Store ID"
              htmlFor="sslcommerzStoreId"
              error={fe("sslcommerzStoreId")}
            >
              <FormInput
                id="sslcommerzStoreId"
                value={form.sslcommerzStoreId}
                error={fe("sslcommerzStoreId")}
                onChange={(e) => setField("sslcommerzStoreId", e.target.value)}
              />
            </FormField>
            <FormField
              label="Store Password"
              htmlFor="sslcommerzStorePass"
              error={fe("sslcommerzStorePass")}
            >
              <FormInput
                id="sslcommerzStorePass"
                type="password"
                value={form.sslcommerzStorePass}
                error={fe("sslcommerzStorePass")}
                onChange={(e) => setField("sslcommerzStorePass", e.target.value)}
                placeholder="Leave blank to keep"
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.sslcommerzSandbox}
              onCheckedChange={(c) => setField("sslcommerzSandbox", c === true)}
            />
            Sandbox mode
          </label>
        </CardContent>
      </Card>

      <FormSelect2
        label="Default gateway"
        htmlFor="defaultGateway"
        required
        error={fe("defaultGateway")}
        options={GATEWAY_OPTIONS}
        value={form.defaultGateway}
        onChange={(v) => setField("defaultGateway", v)}
        searchable={false}
        className="max-w-xs"
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Payment Settings"}
      </Button>
    </form>
  );
}
