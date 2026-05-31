"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { confirmAction } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function ImpersonateButton({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);

  async function impersonate() {
    const confirmed = await confirmAction({
      title: "Login as tenant?",
      text: "Your session will switch to this tenant's dashboard as their admin user.",
      confirmText: "Yes, login as tenant",
      icon: "question",
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/impersonate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.href = data.url;
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Impersonation failed");
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={impersonate} disabled={loading}>
      <LogIn className="mr-2 h-4 w-4" />
      {loading ? "Opening..." : "Login as tenant"}
    </Button>
  );
}
