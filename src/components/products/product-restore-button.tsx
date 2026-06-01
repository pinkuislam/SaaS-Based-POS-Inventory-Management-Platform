"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function ProductRestoreButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restore failed");
      notify.success("Product restored");
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRestore} disabled={loading}>
      <RotateCcw className="h-4 w-4 mr-1" />
      {loading ? "Restoring..." : "Restore"}
    </Button>
  );
}
