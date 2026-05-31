"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PaymentSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    stripeEnabled: false,
    stripePublishableKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    sslcommerzEnabled: false,
    sslcommerzStoreId: "",
    sslcommerzStorePass: "",
    sslcommerzSandbox: true,
    defaultGateway: "stripe",
  });

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setForm({
          stripeEnabled: data.stripeEnabled,
          stripePublishableKey: data.stripePublishableKey || "",
          stripeSecretKey: "",
          stripeWebhookSecret: data.stripeWebhookSecret === "••••••••" ? "" : data.stripeWebhookSecret || "",
          sslcommerzEnabled: data.sslcommerzEnabled,
          sslcommerzStoreId: data.sslcommerzStoreId || "",
          sslcommerzStorePass: "",
          sslcommerzSandbox: data.sslcommerzSandbox !== false,
          defaultGateway: data.defaultGateway || "stripe",
        });
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Payment settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>International card payments (USD)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.stripeEnabled}
              onCheckedChange={(c) =>
                setForm({ ...form, stripeEnabled: c === true })
              }
            />
            Enable Stripe
          </label>
          <div className="space-y-2">
            <Label>Publishable Key</Label>
            <Input
              value={form.stripePublishableKey}
              onChange={(e) =>
                setForm({ ...form, stripePublishableKey: e.target.value })
              }
              placeholder="pk_test_..."
            />
          </div>
          <div className="space-y-2">
            <Label>Secret Key</Label>
            <Input
              type="password"
              value={form.stripeSecretKey}
              onChange={(e) =>
                setForm({ ...form, stripeSecretKey: e.target.value })
              }
              placeholder="sk_test_... (leave blank to keep)"
            />
          </div>
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input
              type="password"
              value={form.stripeWebhookSecret}
              onChange={(e) =>
                setForm({ ...form, stripeWebhookSecret: e.target.value })
              }
              placeholder="whsec_..."
            />
            <p className="text-xs text-muted-foreground">
              Webhook URL: {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/stripe
            </p>
          </div>
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
              onCheckedChange={(c) =>
                setForm({ ...form, sslcommerzEnabled: c === true })
              }
            />
            Enable SSLCommerz
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Store ID</Label>
              <Input
                value={form.sslcommerzStoreId}
                onChange={(e) =>
                  setForm({ ...form, sslcommerzStoreId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Store Password</Label>
              <Input
                type="password"
                value={form.sslcommerzStorePass}
                onChange={(e) =>
                  setForm({ ...form, sslcommerzStorePass: e.target.value })
                }
                placeholder="Leave blank to keep"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.sslcommerzSandbox}
              onCheckedChange={(c) =>
                setForm({ ...form, sslcommerzSandbox: c === true })
              }
            />
            Sandbox mode
          </label>
        </CardContent>
      </Card>

      <div className="space-y-2 max-w-xs">
        <Label>Default gateway</Label>
        <Select
          value={form.defaultGateway}
          onValueChange={(v) => v && setForm({ ...form, defaultGateway: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Payment Settings"}
      </Button>
    </form>
  );
}
