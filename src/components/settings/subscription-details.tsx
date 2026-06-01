"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const FEATURE_LABELS: Record<string, string> = {
  advanced_reports: "Advanced reports",
  ecommerce: "E-commerce integration",
  api: "REST API access",
};

type PackageInfo = {
  name: string;
  description?: string | null;
  features?: unknown;
  billingCycle?: string;
  maxUsers: number;
  maxBranches: number;
  maxProducts: number;
  storageLimitMb: number;
};

export function SubscriptionPackageFeatures({
  packageInfo,
}: {
  packageInfo: PackageInfo | null;
}) {
  if (!packageInfo) return null;

  const features = Array.isArray(packageInfo.features)
    ? (packageInfo.features as string[])
    : typeof packageInfo.features === "object" && packageInfo.features
      ? Object.keys(packageInfo.features as object)
      : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Package features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          {features.length === 0 ? (
            <p className="text-muted-foreground">Standard POS features</p>
          ) : (
            features.map((f) => (
              <Badge key={f} variant="secondary">
                {FEATURE_LABELS[f] || f}
              </Badge>
            ))
          )}
        </div>
        <ul className="text-muted-foreground space-y-1">
          <li>Users: up to {packageInfo.maxUsers}</li>
          <li>Branches: up to {packageInfo.maxBranches}</li>
          <li>Products: up to {packageInfo.maxProducts}</li>
          <li>Storage: {packageInfo.storageLimitMb} MB</li>
        </ul>
      </CardContent>
    </Card>
  );
}

export function SubscriptionPaymentHistory() {
  const [payments, setPayments] = useState<
    {
      id: string;
      amount: number;
      method: string | null;
      status: string;
      transactionId: string | null;
      paidAt: string | null;
      createdAt: string;
    }[]
  >([]);

  useEffect(() => {
    fetch("/api/tenant/subscription/payments")
      .then((r) => r.json())
      .then((d) => setPayments(d.payments || []))
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment history</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No subscription payments recorded yet.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center border rounded px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    {formatCurrency(p.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.paidAt
                      ? formatDate(p.paidAt)
                      : formatDate(p.createdAt)}{" "}
                    · {p.method || "—"}
                  </p>
                </div>
                <Badge>{p.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function SubscriptionUpgradeRequest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [targetPackage, setTargetPackage] = useState("");
  const [type, setType] = useState<"upgrade" | "downgrade">("upgrade");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/subscription/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, targetPackage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("");
      setTargetPackage("");
      alert(data.message);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Package change request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-1 rounded text-sm border ${type === "upgrade" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setType("upgrade")}
            >
              Upgrade
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded text-sm border ${type === "downgrade" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setType("downgrade")}
            >
              Downgrade
            </button>
          </div>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Target package name (optional)"
            value={targetPackage}
            onChange={(e) => setTargetPackage(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
            placeholder="Additional notes"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit request"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
