"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { productSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormSelect2,
} from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

export function ProductFormDialog({
  categories,
  brands,
  units,
}: {
  categories: Option[];
  brands: Option[];
  units: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      name: "",
      sku: "",
      barcode: "",
      categoryId: "",
      brandId: "",
      unitId: "",
      purchasePrice: "",
      sellingPrice: "",
      wholesalePrice: "",
      batchNo: "",
      expiryDate: "",
      stockQty: "",
      reorderLevel: "10",
    },
    productSchema
  );

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));
  const unitOptions = units.map((u) => ({ value: u.id, label: u.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          purchasePrice: parseFloat(data.purchasePrice || "0") || 0,
          sellingPrice: parseFloat(data.sellingPrice) || 0,
          wholesalePrice: data.wholesalePrice
            ? parseFloat(data.wholesalePrice)
            : null,
          batchNo: data.batchNo || null,
          expiryDate: data.expiryDate || null,
          stockQty: parseFloat(data.stockQty || "0") || 0,
          reorderLevel: parseFloat(data.reorderLevel || "0") || 0,
          categoryId: data.categoryId || null,
          brandId: data.brandId || null,
          unitId: data.unitId || null,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Product created");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      notify.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add Product
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Product Name"
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
          <div className="grid grid-cols-3 gap-4">
            <FormSelect2
              label="Category"
              htmlFor="categoryId"
              options={categoryOptions}
              value={values.categoryId}
              onChange={(v) => setField("categoryId", v)}
              placeholder="Select"
              error={fieldError("categoryId")}
            />
            <FormSelect2
              label="Brand"
              htmlFor="brandId"
              options={brandOptions}
              value={values.brandId}
              onChange={(v) => setField("brandId", v)}
              placeholder="Select"
              error={fieldError("brandId")}
            />
            <FormSelect2
              label="Unit"
              htmlFor="unitId"
              options={unitOptions}
              value={values.unitId}
              onChange={(v) => setField("unitId", v)}
              placeholder="Select"
              error={fieldError("unitId")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Purchase Price"
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
              label="Selling Price"
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
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Wholesale Price"
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Opening Stock"
              htmlFor="stockQty"
              error={fieldError("stockQty")}
            >
              <FormInput
                id="stockQty"
                name="stockQty"
                type="number"
                value={values.stockQty}
                error={fieldError("stockQty")}
                onChange={(e) => setField("stockQty", e.target.value)}
              />
            </FormField>
            <FormField
              label="Reorder Level"
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
