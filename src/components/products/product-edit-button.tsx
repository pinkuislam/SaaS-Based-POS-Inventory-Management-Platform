"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { productEditSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
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
  const expiry = product.expiryDate ? product.expiryDate.slice(0, 10) : "";

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      name: product.name,
      sku: product.sku || "",
      barcode: product.barcode || "",
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      wholesalePrice: String(product.wholesalePrice ?? 0),
      batchNo: product.batchNo || "",
      expiryDate: expiry,
      reorderLevel: String(product.reorderLevel),
    },
    productEditSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          purchasePrice: parseFloat(data.purchasePrice || "0"),
          sellingPrice: parseFloat(data.sellingPrice),
          wholesalePrice: data.wholesalePrice
            ? parseFloat(data.wholesalePrice)
            : null,
          batchNo: data.batchNo || null,
          expiryDate: data.expiryDate || null,
          reorderLevel: parseFloat(data.reorderLevel || "0"),
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Product updated");
      setOpen(false);
      router.refresh();
    } catch {
      notify.error("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Name"
            htmlFor="name"
            required
            error={fieldError("name")}
          >
            <FormInput
              id="name"
              name="name"
              value={values.name}
              error={fieldError("name")}
              onChange={(e) => setField("name", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU" htmlFor="sku" error={fieldError("sku")}>
              <FormInput
                id="sku"
                name="sku"
                value={values.sku}
                error={fieldError("sku")}
                onChange={(e) => setField("sku", e.target.value)}
              />
            </FormField>
            <FormField
              label="Barcode"
              htmlFor="barcode"
              error={fieldError("barcode")}
            >
              <FormInput
                id="barcode"
                name="barcode"
                value={values.barcode}
                error={fieldError("barcode")}
                onChange={(e) => setField("barcode", e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Wholesale"
              htmlFor="wholesalePrice"
              error={fieldError("wholesalePrice")}
            >
              <FormInput
                id="wholesalePrice"
                name="wholesalePrice"
                type="number"
                step="0.01"
                value={values.wholesalePrice}
                error={fieldError("wholesalePrice")}
                onChange={(e) => setField("wholesalePrice", e.target.value)}
              />
            </FormField>
            <FormField
              label="Batch No"
              htmlFor="batchNo"
              error={fieldError("batchNo")}
            >
              <FormInput
                id="batchNo"
                name="batchNo"
                value={values.batchNo}
                error={fieldError("batchNo")}
                onChange={(e) => setField("batchNo", e.target.value)}
              />
            </FormField>
          </div>
          <FormField
            label="Expiry Date"
            htmlFor="expiryDate"
            error={fieldError("expiryDate")}
          >
            <FormInput
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={values.expiryDate}
              error={fieldError("expiryDate")}
              onChange={(e) => setField("expiryDate", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Cost"
              htmlFor="purchasePrice"
              error={fieldError("purchasePrice")}
            >
              <FormInput
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                value={values.purchasePrice}
                error={fieldError("purchasePrice")}
                onChange={(e) => setField("purchasePrice", e.target.value)}
              />
            </FormField>
            <FormField
              label="Price"
              htmlFor="sellingPrice"
              required
              error={fieldError("sellingPrice")}
            >
              <FormInput
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                value={values.sellingPrice}
                error={fieldError("sellingPrice")}
                onChange={(e) => setField("sellingPrice", e.target.value)}
              />
            </FormField>
            <FormField
              label="Reorder"
              htmlFor="reorderLevel"
              error={fieldError("reorderLevel")}
            >
              <FormInput
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                value={values.reorderLevel}
                error={fieldError("reorderLevel")}
                onChange={(e) => setField("reorderLevel", e.target.value)}
              />
            </FormField>
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
