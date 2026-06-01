"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormTextarea, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type {
  TenantGeneralSettings,
  TenantNotificationSettings,
  TenantReturnPolicySettings,
  TenantSecuritySettings,
  TenantStockSettings,
} from "@/lib/tenant-settings";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function NotificationPreferencesForm({
  initial,
}: {
  initial: TenantNotificationSettings;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    emailLowStock: initial.emailLowStock ?? true,
    emailCustomerDue: initial.emailCustomerDue ?? false,
    emailSupplierDue: initial.emailSupplierDue ?? false,
    inAppCustomerDue: initial.inAppCustomerDue ?? true,
    inAppSupplierDue: initial.inAppSupplierDue ?? true,
    inAppPurchaseDue: initial.inAppPurchaseDue ?? true,
    inAppSaleReturn: initial.inAppSaleReturn ?? true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: values }),
      });
      if (!res.ok) throw new Error();
      notify.success("Notification preferences saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SettingsSection title="Email alerts">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["emailLowStock", "Low stock"],
            ["emailCustomerDue", "Customer due"],
            ["emailSupplierDue", "Supplier due"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={values[key as keyof typeof values] as boolean}
                onCheckedChange={(c) =>
                  setValues((v) => ({ ...v, [key]: c === true }))
                }
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </SettingsSection>
      <SettingsSection title="In-app alerts">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["inAppCustomerDue", "Customer due"],
            ["inAppSupplierDue", "Supplier due"],
            ["inAppPurchaseDue", "Purchase due"],
            ["inAppSaleReturn", "Pending sale returns"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={values[key as keyof typeof values] as boolean}
                onCheckedChange={(c) =>
                  setValues((v) => ({ ...v, [key]: c === true }))
                }
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </SettingsSection>
      <Button type="submit" disabled={loading}>
        Save notification preferences
      </Button>
    </form>
  );
}

export function StockAlertSettingsForm({
  initial,
}: {
  initial: TenantStockSettings;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    lowStockAlertEnabled: initial.lowStockAlertEnabled ?? true,
    lowStockDedupHours: String(initial.lowStockDedupHours ?? 24),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: {
            lowStockAlertEnabled: values.lowStockAlertEnabled,
            lowStockDedupHours: parseInt(values.lowStockDedupHours, 10) || 24,
          },
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Stock alert settings saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="low-stock-enabled"
          checked={values.lowStockAlertEnabled}
          onCheckedChange={(c) =>
            setValues((v) => ({ ...v, lowStockAlertEnabled: c === true }))
          }
        />
        <Label htmlFor="low-stock-enabled">Enable low stock alerts</Label>
      </div>
      <FormField label="Alert cooldown (hours)" htmlFor="dedup-hours">
        <FormInput
          id="dedup-hours"
          type="number"
          min={1}
          max={168}
          value={values.lowStockDedupHours}
          onChange={(e) =>
            setValues((v) => ({ ...v, lowStockDedupHours: e.target.value }))
          }
        />
      </FormField>
      <Button type="submit" disabled={loading}>
        Save stock settings
      </Button>
    </form>
  );
}

export function ReturnPolicyForm({
  initial,
}: {
  initial: TenantReturnPolicySettings;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    saleReturnDays: String(initial.saleReturnDays ?? 7),
    purchaseReturnDays: String(initial.purchaseReturnDays ?? 14),
    policyText: initial.policyText ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnPolicy: {
            saleReturnDays: parseInt(values.saleReturnDays, 10) || 7,
            purchaseReturnDays: parseInt(values.purchaseReturnDays, 10) || 14,
            policyText: values.policyText,
          },
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Return policy saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sale return window (days)" htmlFor="sale-days">
          <FormInput
            id="sale-days"
            type="number"
            min={0}
            value={values.saleReturnDays}
            onChange={(e) =>
              setValues((v) => ({ ...v, saleReturnDays: e.target.value }))
            }
          />
        </FormField>
        <FormField label="Purchase return window (days)" htmlFor="purchase-days">
          <FormInput
            id="purchase-days"
            type="number"
            min={0}
            value={values.purchaseReturnDays}
            onChange={(e) =>
              setValues((v) => ({ ...v, purchaseReturnDays: e.target.value }))
            }
          />
        </FormField>
      </div>
      <FormField label="Return policy text" htmlFor="policy-text">
        <FormTextarea
          id="policy-text"
          rows={4}
          value={values.policyText}
          onChange={(e) =>
            setValues((v) => ({ ...v, policyText: e.target.value }))
          }
        />
      </FormField>
      <Button type="submit" disabled={loading}>
        Save return policy
      </Button>
    </form>
  );
}

export function GeneralSettingsForm({
  initial,
}: {
  initial: TenantGeneralSettings;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    dateFormat: initial.dateFormat ?? "dd/MM/yyyy",
    paymentMethods: (initial.paymentMethods ?? [
      "cash",
      "card",
      "mobile",
      "bank",
    ]).join(", "),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: {
            dateFormat: values.dateFormat,
            paymentMethods: values.paymentMethods
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          },
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("General settings saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSelect2
        label="Date format"
        value={values.dateFormat}
        onChange={(v) => setValues((s) => ({ ...s, dateFormat: v }))}
        options={[
          { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
          { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
          { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
        ]}
      />
      <FormField
        label="Payment methods (comma-separated)"
        htmlFor="pay-methods"
      >
        <FormInput
          id="pay-methods"
          value={values.paymentMethods}
          onChange={(e) =>
            setValues((v) => ({ ...v, paymentMethods: e.target.value }))
          }
          placeholder="cash, card, mobile, bank"
        />
      </FormField>
      <Button type="submit" disabled={loading}>
        Save general settings
      </Button>
    </form>
  );
}

export function SecuritySettingsPanel({
  initial,
  tenantSlug,
}: {
  initial: TenantSecuritySettings;
  tenantSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeout, setTimeout] = useState(
    String(initial.sessionTimeoutMinutes ?? 480)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          security: {
            sessionTimeoutMinutes: parseInt(timeout, 10) || 480,
          },
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Security preferences saved");
      router.refresh();
    } catch {
      notify.error("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Preferred session timeout (minutes)"
          htmlFor="session-timeout"
        >
          <FormInput
            id="session-timeout"
            type="number"
            min={30}
            max={1440}
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
          />
        </FormField>
        <p className="text-xs text-muted-foreground">
          Platform-wide session limits may still apply. Manage users and roles
          for access control.
        </p>
        <Button type="submit" disabled={loading}>
          Save security preferences
        </Button>
      </form>
    </div>
  );
}
