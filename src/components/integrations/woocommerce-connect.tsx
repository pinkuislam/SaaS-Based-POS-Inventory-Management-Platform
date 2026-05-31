"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Plug, Package, ShoppingCart } from "lucide-react";
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

export function WooCommerceConnect() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedConfig | null>(null);
  const [orders, setOrders] = useState<OnlineOrderRow[]>([]);
  const [form, setForm] = useState({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    isActive: true,
    syncProducts: true,
    syncStock: true,
    syncOrders: true,
  });

  async function loadConfig() {
    const res = await fetch("/api/integrations");
    const data = await res.json();
    if (data && data.storeUrl) {
      setSaved(data);
      setForm((f) => ({
        ...f,
        storeUrl: data.storeUrl,
        isActive: data.isActive,
        syncProducts: data.syncProducts,
        syncStock: data.syncStock,
        syncOrders: data.syncOrders,
      }));
    }
  }

  async function loadOrders() {
    const res = await fetch("/api/integrations/orders");
    if (res.ok) setOrders(await res.json());
  }

  useEffect(() => {
    loadConfig();
    loadOrders();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("WooCommerce settings saved");
      await loadConfig();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) toast.success(data.message);
      else toast.error(data.message);
    } catch {
      toast.error("Connection test failed");
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
      toast.success(`Products: ${data.created} created, ${data.updated} updated`);
      await loadConfig();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
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
      toast.success(`Orders: ${data.imported} imported, ${data.skipped} skipped`);
      await loadConfig();
      await loadOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
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
                Connect your store URL and REST API keys (WooCommerce → Settings →
                Advanced → REST API)
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
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label>Store URL *</Label>
              <Input
                placeholder="https://yourstore.com"
                value={form.storeUrl}
                onChange={(e) => setForm({ ...form, storeUrl: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Key *</Label>
              <Input
                value={form.consumerKey}
                onChange={(e) => setForm({ ...form, consumerKey: e.target.value })}
                required={!saved?.hasCredentials}
                placeholder={saved?.hasCredentials ? "Leave blank to keep existing" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Secret *</Label>
              <Input
                type="password"
                value={form.consumerSecret}
                onChange={(e) =>
                  setForm({ ...form, consumerSecret: e.target.value })
                }
                required={!saved?.hasCredentials}
                placeholder={saved?.hasCredentials ? "Leave blank to keep existing" : ""}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                ["isActive", "Enable integration"],
                ["syncProducts", "Sync products"],
                ["syncStock", "Update stock from WooCommerce"],
                ["syncOrders", "Import online orders as sales"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form[key as keyof typeof form] as boolean}
                    onCheckedChange={(c) =>
                      setForm({ ...form, [key]: c === true })
                    }
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
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Online Orders</CardTitle>
            <Button variant="ghost" size="icon" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No imported orders yet. Run &quot;Sync Orders&quot; after connecting.
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
