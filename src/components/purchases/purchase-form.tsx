"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { notify } from "@/lib/notify";
import { purchaseFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { usePurchaseStore } from "@/stores/purchase-store";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormSelect2,
} from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Trash2 } from "lucide-react";
import { formatCurrency, decimalToNumber } from "@/lib/utils";

interface ProductResult {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: unknown;
  stockQty: unknown;
}

export function PurchaseForm({ purchaseId }: { purchaseId?: string }) {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || "";
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const {
    items,
    supplierId,
    supplierInvoiceNo,
    discount,
    tax,
    shippingCost,
    paidAmount,
    paymentMethod,
    notes,
    addItem,
    updateQuantity,
    updateUnitPrice,
    removeItem,
    setSupplier,
    setDiscount,
    setTax,
    setShippingCost,
    setSupplierInvoiceNo,
    setPaymentMethod,
    setPaidAmount,
    setNotes,
    clear,
    getSubtotal,
    getTotal,
  } = usePurchaseStore();

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      supplierId: supplierId || "",
      paidAmount: paidAmount ? String(paidAmount) : "",
      notes: notes || "",
    },
    purchaseFormSchema
  );

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      return;
    }
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
    setProducts(await res.json());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(t);
  }, [search, searchProducts]);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setField("supplierId", supplierId || "");
  }, [supplierId, setField]);

  useEffect(() => {
    setField("notes", notes || "");
  }, [notes, setField]);

  function handleAdd(product: ProductResult) {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: decimalToNumber(product.purchasePrice) || 0,
    });
    setSearch("");
    setProducts([]);
  }

  const supplierOptions = [
    { value: "", label: "No supplier" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  async function savePurchase(status: "DRAFT" | "COMPLETED") {
    if (items.length === 0) {
      notify.error("Add at least one product");
      return;
    }

    const data = validate();
    if (!data) return;

    const subtotal = getSubtotal();
    const total = getTotal();
    setLoading(true);

    const purchaseItems = items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: 0,
        total: lineTotal,
      };
    });

    const payload = {
      items: purchaseItems,
      supplierId: data.supplierId || null,
      supplierInvoiceNo: supplierInvoiceNo || null,
      subtotal,
      discount,
      tax,
      shippingCost,
      total,
      paidAmount: data.paidAmount
        ? parseFloat(data.paidAmount)
        : paidAmount || 0,
      paymentMethod,
      notes: data.notes,
      status,
    };

    try {
      const url = purchaseId
        ? `/api/purchases/${purchaseId}`
        : "/api/purchases";
      const method = purchaseId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      if (purchaseId && status === "COMPLETED") {
        const completeRes = await fetch(
          `/api/purchases/${purchaseId}/complete`,
          { method: "POST" }
        );
        if (!completeRes.ok) {
          const err = await completeRes.json();
          throw new Error(err.error);
        }
      }

      notify.success(
        status === "DRAFT"
          ? `Draft saved: ${result.invoiceNo}`
          : `Purchase saved: ${result.invoiceNo}`
      );
      clear();
      router.push(tenantDashboardPath(tenantSlug, "/purchases"));
      router.refresh();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed to save purchase");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    savePurchase("COMPLETED");
  }

  const total = getTotal();

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-4" noValidate>
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <FormInput
                placeholder="Search products to add..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {products.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex justify-between p-3 hover:bg-muted text-left"
                    onClick={() => handleAdd(p)}
                  >
                    <span>{p.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Cost: {formatCurrency(decimalToNumber(p.purchasePrice))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">
              Purchase Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Search and add products
              </p>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-wrap items-center gap-2 p-4"
                  >
                    <div className="flex-1 min-w-[120px]">
                      <p className="font-medium">{item.name}</p>
                      <FormInput
                        type="number"
                        className="h-8 w-24 mt-1"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateUnitPrice(
                            item.productId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground ml-1">
                        / unit
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-medium w-24 text-right">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormSelect2
            label="Supplier"
            htmlFor="supplierId"
            options={supplierOptions}
            value={values.supplierId}
            onChange={(v) => {
              setField("supplierId", v);
              if (v === "") setSupplier(null, "");
              else {
                const s = suppliers.find((s) => s.id === v);
                setSupplier(v, s?.name || "");
              }
            }}
            placeholder="Select supplier"
            error={fieldError("supplierId")}
          />

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Discount">
              <FormInput
                type="number"
                value={discount || ""}
                onChange={(e) =>
                  setDiscount(parseFloat(e.target.value) || 0)
                }
              />
            </FormField>
            <FormField label="Tax">
              <FormInput
                type="number"
                value={tax || ""}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Shipping">
              <FormInput
                type="number"
                value={shippingCost || ""}
                onChange={(e) =>
                  setShippingCost(parseFloat(e.target.value) || 0)
                }
              />
            </FormField>
            <FormField label="Payment method">
              <FormSelect2
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "bank", label: "Bank" },
                  { value: "card", label: "Card" },
                  { value: "cheque", label: "Cheque" },
                ]}
              />
            </FormField>
          </div>

          <FormField
            label="Paid Amount"
            htmlFor="paidAmount"
            error={fieldError("paidAmount")}
          >
            <FormInput
              id="paidAmount"
              name="paidAmount"
              type="number"
              value={values.paidAmount || total || ""}
              error={fieldError("paidAmount")}
              onChange={(e) => {
                setField("paidAmount", e.target.value);
                setPaidAmount(parseFloat(e.target.value) || 0);
              }}
            />
          </FormField>

          <FormField
            label="Notes"
            htmlFor="notes"
            error={fieldError("notes")}
          >
            <FormInput
              id="notes"
              name="notes"
              value={values.notes}
              error={fieldError("notes")}
              onChange={(e) => {
                setField("notes", e.target.value);
                setNotes(e.target.value);
              }}
            />
          </FormField>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Due</span>
              <span>
                {formatCurrency(Math.max(0, total - (paidAmount || total)))}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={loading || items.length === 0}
              onClick={() => savePurchase("DRAFT")}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || items.length === 0}
            >
              {loading ? "Saving..." : "Complete purchase"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
