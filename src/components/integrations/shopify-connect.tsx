"use client";

import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { shopifySchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
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
import { RefreshCw, Store, Package, ShoppingCart } from "lucide-react";
import { formatDate, decimalToNumber, formatCurrency } from "@/lib/utils";

interface SavedConfig {
  storeUrl: string;
  isActive: boolean;
  syncProducts: boolean;
  syncStock: boolean;
  syncOrders: boolean;
  lastProductSync: string | null;
  lastOrderSync: string | null;
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

function normalizeShopifyUrl(url: string) {
  let u = url.trim().replace(/\/$/, "");
  if (!u.includes("://")) u = `https://${u}`;
  return u;
}

export function ShopifyConnect() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedConfig | null>(null);
  const [orders, setOrders] = useState<OnlineOrderRow[]>([]);

  const { values, setField, validate, fieldError, setValues } = useValidatedForm(
    {
      storeUrl: "",
      accessToken: "",
      isActive: true,
      syncProducts: true,
      syncStock: true,
      syncOrders: true,
    },
    shopifySchema
  );

  async function loadConfig() {
    const res = await fetch("/api/integrations?platform=shopify");
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
      }));
    } else {
      setSaved(null);
    }
  }

  async function loadOrders() {
    const res = await fetch("/api/integrations/orders?platform=shopify");
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

    if (!saved?.hasCredentials && !data.accessToken) {
      notify.error("Admin API access token is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "shopify",
          storeUrl: normalizeShopifyUrl(data.storeUrl),
          consumerKey: data.accessToken,
          consumerSecret: "-",
          isActive: data.isActive,
          syncProducts: data.syncProducts,
          syncStock: data.syncStock,
          syncOrders: data.syncOrders,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Shopify settings saved");
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
      const res = await fetch("/api/integrations/shopify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeUrl: normalizeShopifyUrl(values.storeUrl),
          accessToken: values.accessToken,
        }),
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
      const res = await fetch("/api/integrations/shopify/sync-products", {
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

  async function syncOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/shopify/sync-orders", {
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

  async function handleDisconnect() {
    if (!saved?.hasCredentials) return;
    if (!confirm("Disconnect Shopify? The access token will be removed.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/integrations?platform=shopify", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Shopify disconnected");
      setSaved(null);
      setValues({
        storeUrl: "",
        accessToken: "",
        isActive: true,
        syncProducts: true,
        syncStock: true,
        syncOrders: true,
      });
      setOrders([]);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Disconnect failed");
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
                <Store className="h-5 w-5" />
                Shopify
              </CardTitle>
              <CardDescription>
                Connect with a custom app Admin API access token (Shopify Admin
                → Settings → Apps and sales channels → Develop apps)
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
              htmlFor="shopifyStoreUrl"
              required
              error={fieldError("storeUrl")}
            >
              <FormInput
                id="shopifyStoreUrl"
                name="shopifyStoreUrl"
                placeholder="your-store.myshopify.com"
                value={values.storeUrl}
                error={fieldError("storeUrl")}
                onChange={(e) => setField("storeUrl", e.target.value)}
              />
            </FormField>
            <FormField
              label="Admin API access token"
              htmlFor="shopifyToken"
              required={!saved?.hasCredentials}
              error={fieldError("accessToken")}
            >
              <FormInput
                id="shopifyToken"
                name="shopifyToken"
                type="password"
                value={values.accessToken}
                error={fieldError("accessToken")}
                onChange={(e) => setField("accessToken", e.target.value)}
                placeholder={
                  saved?.hasCredentials ? "Leave blank to keep existing" : ""
                }
              />
            </FormField>
            <p className="text-xs text-muted-foreground">
              Required scopes: read_products, read_inventory, read_orders (and
              write_inventory if updating stock from Shopify).
            </p>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["isActive", "Enable integration"],
                  ["syncProducts", "Sync products"],
                  ["syncStock", "Update stock from Shopify"],
                  ["syncOrders", "Import paid orders as sales"],
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
            <CardTitle>Shopify Orders</CardTitle>
            <Button variant="ghost" size="icon" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No imported Shopify orders yet. Run &quot;Sync Orders&quot; after
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
