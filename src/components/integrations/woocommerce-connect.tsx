"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { woocommerceSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RefreshCw, Plug, Package, ShoppingCart } from "lucide-react";
import { formatDate, decimalToNumber, formatCurrency } from "@/lib/utils";

interface SavedConfig {
  storeUrl: string;
  isActive: boolean;
  syncProducts: boolean;
  syncStock: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  syncDirection: string;
  hasWebhookSecret?: boolean;
  lastProductSync: string | null;
  lastOrderSync: string | null;
  lastCustomerSync: string | null;
  hasCredentials: boolean;
}

interface OnlineOrderRow {
  id: string;
  orderNumber: string;
  customerName: string | null;
  total: unknown;
  status: string;
  orderDate: string;
  saleId: string | null;
}

export function WooCommerceConnect() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedConfig | null>(null);
  const [orders, setOrders] = useState<OnlineOrderRow[]>([]);

  const { values, setField, validate, fieldError, setValues } =
    useValidatedForm(
      {
        storeUrl: "",
        consumerKey: "",
        consumerSecret: "",
        isActive: true,
        syncProducts: true,
        syncStock: true,
        syncOrders: true,
        syncCustomers: false,
        syncDirection: "inbound",
        webhookSecret: "",
      },
      woocommerceSchema
    );

  async function loadConfig() {
    const res = await fetch("/api/integrations?platform=woocommerce");
    const data = await res.json();
    if (data && data.storeUrl) {
      setSaved(data);
      setValues((prev) => ({
        ...prev,
        storeUrl: data.storeUrl,
        isActive: data.isActive,
        syncProducts: data.syncProducts,
        syncStock: data.syncStock,
        syncOrders: data.syncOrders,
        syncCustomers: data.syncCustomers ?? false,
        syncDirection: data.syncDirection || "inbound",
        webhookSecret: "",
      }));
    }
  }

  async function loadOrders() {
    const res = await fetch("/api/integrations/orders?platform=woocommerce");
    if (res.ok) setOrders(await res.json());
  }

  useEffect(() => {
    loadConfig();
    loadOrders();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    if (!saved?.hasCredentials && !data.consumerKey) {
      notify.error("Consumer key is required");
      return;
    }
    if (!saved?.hasCredentials && !data.consumerSecret) {
      notify.error("Consumer secret is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, platform: "woocommerce" }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("WooCommerce settings saved");
      await loadConfig();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/woocommerce/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.ok) notify.success(data.message);
      else notify.error(data.message);
    } catch {
      notify.error("Connection test failed");
    } finally {
      setLoading(false);
    }
  }

  async function syncProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/woocommerce/sync-products", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(`Products: ${data.created} created, ${data.updated} updated`);
      await loadConfig();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!saved?.hasCredentials) return;
    if (!confirm("Disconnect WooCommerce? API keys will be removed.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations?platform=woocommerce", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("WooCommerce disconnected");
      setSaved(null);
      setValues({
        storeUrl: "",
        consumerKey: "",
        consumerSecret: "",
        isActive: true,
        syncProducts: true,
        syncStock: true,
        syncOrders: true,
        syncCustomers: false,
        syncDirection: "inbound",
        webhookSecret: "",
      });
      setOrders([]);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setLoading(false);
    }
  }

  async function syncCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/woocommerce/sync-customers", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(
        `Customers: ${data.created} created, ${data.updated} updated`
      );
      await loadConfig();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  async function syncOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/woocommerce/sync-orders", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success(`Orders: ${data.imported} imported, ${data.skipped} skipped`);
      await loadConfig();
      await loadOrders();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                WooCommerce
              </CardTitle>
              <CardDescription>
                Connect your store URL and REST API keys (WooCommerce → Settings
                → Advanced → REST API)
              </CardDescription>
            </div>
            {saved?.isActive ? (
              <Badge>Connected</Badge>
            ) : (
              <Badge variant="secondary">Not connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl" noValidate>
            <FormField
              label="Store URL"
              htmlFor="storeUrl"
              required
              error={fieldError("storeUrl")}
            >
              <FormInput
                id="storeUrl"
                name="storeUrl"
                placeholder="https://yourstore.com"
                value={values.storeUrl}
                error={fieldError("storeUrl")}
                onChange={(e) => setField("storeUrl", e.target.value)}
              />
            </FormField>
            <FormField
              label="Consumer Key"
              htmlFor="consumerKey"
              required={!saved?.hasCredentials}
              error={fieldError("consumerKey")}
            >
              <FormInput
                id="consumerKey"
                name="consumerKey"
                value={values.consumerKey}
                error={fieldError("consumerKey")}
                onChange={(e) => setField("consumerKey", e.target.value)}
                placeholder={
                  saved?.hasCredentials ? "Leave blank to keep existing" : ""
                }
              />
            </FormField>
            <FormField
              label="Consumer Secret"
              htmlFor="consumerSecret"
              required={!saved?.hasCredentials}
              error={fieldError("consumerSecret")}
            >
              <FormInput
                id="consumerSecret"
                name="consumerSecret"
                type="password"
                value={values.consumerSecret}
                error={fieldError("consumerSecret")}
                onChange={(e) => setField("consumerSecret", e.target.value)}
                placeholder={
                  saved?.hasCredentials ? "Leave blank to keep existing" : ""
                }
              />
            </FormField>
            <FormSelect2
              label="Sync direction"
              value={values.syncDirection || "inbound"}
              onChange={(v) => setField("syncDirection", v)}
              options={[
                { value: "inbound", label: "Inbound (store → POS)" },
                { value: "outbound", label: "Outbound (POS → store)" },
                { value: "both", label: "Both directions" },
              ]}
            />
            <FormField label="Webhook secret (optional)" htmlFor="webhookSecret">
              <FormInput
                id="webhookSecret"
                type="password"
                value={values.webhookSecret}
                onChange={(e) => setField("webhookSecret", e.target.value)}
                placeholder={
                  saved?.hasWebhookSecret ? "Leave blank to keep existing" : ""
                }
              />
            </FormField>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["isActive", "Enable integration"],
                  ["syncProducts", "Sync products"],
                  ["syncStock", "Update stock from WooCommerce"],
                  ["syncOrders", "Import online orders as sales"],
                  ["syncCustomers", "Sync customers"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={values[key]}
                    onCheckedChange={(c) => setField(key, c === true)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {saved?.lastProductSync && (
              <p className="text-xs text-muted-foreground">
                Last product sync: {formatDate(saved.lastProductSync)}
              </p>
            )}
            {saved?.lastOrderSync && (
              <p className="text-xs text-muted-foreground">
                Last order sync: {formatDate(saved.lastOrderSync)}
              </p>
            )}
            {saved?.lastCustomerSync && (
              <p className="text-xs text-muted-foreground">
                Last customer sync: {formatDate(saved.lastCustomerSync)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                Save Settings
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={loading}
              >
                Test Connection
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={syncProducts}
                disabled={loading || !saved?.isActive}
              >
                <Package className="h-4 w-4 mr-2" />
                Sync Products
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={syncOrders}
                disabled={loading || !saved?.isActive}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Sync Orders
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={syncCustomers}
                disabled={loading || !saved?.isActive}
              >
                Sync Customers
              </Button>
              {saved?.hasCredentials && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>WooCommerce Orders</CardTitle>
            <Button variant="ghost" size="icon" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No imported orders yet. Run &quot;Sync Orders&quot; after
              connecting.
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex justify-between items-center border rounded p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">#{o.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {o.customerName || "Guest"} · {formatDate(o.orderDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(decimalToNumber(o.total))}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {o.saleId ? "POS sale created" : o.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
