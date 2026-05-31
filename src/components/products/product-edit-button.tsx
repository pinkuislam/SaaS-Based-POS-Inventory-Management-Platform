"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import type { SerializedProductClient } from "@/lib/serialize";
import { ProductImageUpload } from "@/components/products/product-image-upload";

export function ProductEditButton({
  product,
}: {
  product: SerializedProductClient;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const expiry = product.expiryDate
    ? product.expiryDate.slice(0, 10)
    : "";

  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku || "",
    barcode: product.barcode || "",
    purchasePrice: String(product.purchasePrice),
    sellingPrice: String(product.sellingPrice),
    wholesalePrice: String(product.wholesalePrice ?? 0),
    batchNo: product.batchNo || "",
    expiryDate: expiry,
    reorderLevel: String(product.reorderLevel),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchasePrice: parseFloat(form.purchasePrice),
          sellingPrice: parseFloat(form.sellingPrice),
          wholesalePrice: form.wholesalePrice
            ? parseFloat(form.wholesalePrice)
            : null,
          batchNo: form.batchNo || null,
          expiryDate: form.expiryDate || null,
          reorderLevel: parseFloat(form.reorderLevel),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Product updated");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg hover:bg-muted h-8 w-8">
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wholesale</Label>
              <Input
                type="number"
                step="0.01"
                value={form.wholesalePrice}
                onChange={(e) =>
                  setForm({ ...form, wholesalePrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Batch No</Label>
              <Input
                value={form.batchNo}
                onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({ ...form, purchasePrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({ ...form, sellingPrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Reorder</Label>
              <Input
                type="number"
                value={form.reorderLevel}
                onChange={(e) =>
                  setForm({ ...form, reorderLevel: e.target.value })
                }
              />
            </div>
          </div>
          <ProductImageUpload
            productId={product.id}
            imageUrl={product.image ?? null}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Update"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
