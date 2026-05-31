"use client";

import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function PackageDuplicateButton({ packageId }: { packageId: string }) {
  const router = useRouter();

  async function duplicate() {
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
  }

  return (
    <Button size="sm" variant="outline" onClick={duplicate}>
      <Copy className="mr-1 h-3 w-3" />
      Duplicate
    </Button>
  );
}
