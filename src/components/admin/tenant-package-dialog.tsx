"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "lucide-react";

export function TenantPackageDialog({
  tenantId,
  tenantName,
  currentPackageId,
  packages,
}: {
  tenantId: string;
  tenantName: string;
  currentPackageId: string | null;
  packages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packageId, setPackageId] = useState(currentPackageId || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!packageId) {
      toast.error("Select a package");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/package`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Package updated");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        <Package className="h-3 w-3" /> Change
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Package — {tenantName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Subscription Package</Label>
            <Select
              value={packageId}
              onValueChange={(v) => setPackageId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Update Package"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
