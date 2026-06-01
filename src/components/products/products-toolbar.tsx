"use client";

import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductImportDialog } from "@/components/products/product-import-dialog";

interface Option {
  id: string;
  name: string;
}

export function ProductsToolbar({
  categories,
  brands,
  units,
}: {
  categories: Option[];
  brands: Option[];
  units: Option[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProductImportDialog />
      <ProductFormDialog categories={categories} brands={brands} units={units} />
    </div>
  );
}
