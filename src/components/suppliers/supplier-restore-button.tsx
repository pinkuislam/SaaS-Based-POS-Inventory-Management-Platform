"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function SupplierRestoreButton({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/suppliers/${supplierId}/restore`, {
            method: "POST",
          });
          if (!res.ok) throw new Error();
          notify.success("Supplier restored");
          router.refresh();
        } catch {
          notify.error("Restore failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      <RotateCcw className="h-4 w-4" />
    </Button>
  );
}
