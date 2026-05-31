"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone } from "lucide-react";
import { Suspense } from "react";

function BillingInner({
  packageName,
  amount,
  expires,
  status,
}: {
  packageName: string;
  amount: string;
  expires: string;
  status: string;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    stripeEnabled: false,
    sslcommerzEnabled: false,
    defaultGateway: "stripe",
  });

  useEffect(() => {
    fetch("/api/billing/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    if (success === "1" && sessionId) {
      fetch("/api/billing/stripe/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            notify.success("Subscription payment successful!");
            window.location.href = "/dashboard/settings/billing";
          } else {
            notify.error(data.error || "Payment verification failed");
          }
        });
    }
    if (searchParams.get("failed") === "1") {
      notify.error("Payment failed");
    }
    if (searchParams.get("cancelled") === "1") {
      notify.info("Payment cancelled");
    }
  }, [searchParams]);

  async function pay(gateway: "stripe" | "sslcommerz") {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Package</span>
        <span className="font-medium">{packageName}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-medium">{amount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Expires</span>
        <span>{expires}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <Badge>{status}</Badge>
      </div>

      <div className="pt-4 border-t space-y-2">
        <p className="text-sm font-medium">Renew / Pay Subscription</p>
        {config.stripeEnabled && (
          <Button
            className="w-full"
            onClick={() => pay("stripe")}
            disabled={loading}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay with Stripe (Card)
          </Button>
        )}
        {config.sslcommerzEnabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => pay("sslcommerz")}
            disabled={loading}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Pay with SSLCommerz (bKash / Card)
          </Button>
        )}
        {!config.stripeEnabled && !config.sslcommerzEnabled && (
          <p className="text-sm text-muted-foreground">
            No payment gateway configured. Contact platform administrator.
          </p>
        )}
      </div>
    </div>
  );
}

export function SubscriptionBilling(props: {
  packageName: string;
  amount: string;
  expires: string;
  status: string;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <BillingInner {...props} />
    </Suspense>
  );
}
