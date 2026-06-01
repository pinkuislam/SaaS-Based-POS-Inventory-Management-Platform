"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { ActionButton } from "@/components/admin/loading-button";
import { Copy } from "lucide-react";

export function PackageDuplicateButton({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function duplicate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        notify.success("Package duplicated (inactive copy)");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        notify.error(data.error || "Duplicate failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton
      size="sm"
      variant="outline"
      onClick={duplicate}
      loading={loading}
      loadingText="Duplicating..."
    >
      <Copy className="mr-1 h-3 w-3" />
      Duplicate
    </ActionButton>
  );
}
