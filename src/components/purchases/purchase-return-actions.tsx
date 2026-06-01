"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { notify } from "@/lib/notify";
import { confirmDelete } from "@/lib/confirm";
import { Button } from "@/components/ui/button";
import { tenantDashboardPath } from "@/lib/tenant-path";

export function PurchaseReturnActions({
  returnId,
  status,
}: {
  returnId: string;
  status: string;
}) {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const [loading, setLoading] = useState(false);

  async function complete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-returns/${returnId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Return completed — stock reduced");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeDraft() {
    const ok = await confirmDelete("Delete this draft return?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-returns/${returnId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      notify.success("Draft deleted");
      router.push(tenantDashboardPath(tenantSlug, "/purchase-returns"));
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  async function cancelReturn() {
    const reason = window.prompt("Cancellation reason (required):");
    if (!reason?.trim()) {
      notify.error("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/purchase-returns/${returnId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify.success("Return cancelled — stock restored");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setLoading(false);
    }
  }

  if (status === "DRAFT") {
    return (
      <div className="flex gap-2">
        <Button onClick={complete} disabled={loading}>
          Complete return
        </Button>
        <Button variant="destructive" onClick={removeDraft} disabled={loading}>
          Delete draft
        </Button>
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <Button variant="destructive" onClick={cancelReturn} disabled={loading}>
        Cancel return
      </Button>
    );
  }

  return null;
}
