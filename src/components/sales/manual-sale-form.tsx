"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { manualSaleSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormSelect2,
} from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { decimalToNumber } from "@/lib/utils";

type ProductHit = {
  id: string;
  name: string;
  sellingPrice: unknown;
  stockQty: unknown;
};

type CustomerOption = { id: string; name: string };

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile" },
  { value: "bank", label: "Bank" },
];

export function ManualSaleForm({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductHit[]>([]);
  const [lines, setLines] = useState<
    { productId: string; name: string; qty: string; price: string }[]
  >([]);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      customerId: "walk-in",
      paymentMethod: "cash",
      paidAmount: "",
      notes: "",
    },
    manualSaleSchema
  );

  const customerOptions = [
    { value: "walk-in", label: "Walk-in" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function handleSearch() {
    if (!search.trim()) return;
    const res = await fetch(
      `/api/products/search?q=${encodeURIComponent(search)}`
    );
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
  }

  function addLine(p: ProductHit) {
    if (lines.some((l) => l.productId === p.id)) return;
    setLines([
      ...lines,
      {
        productId: p.id,
        name: p.name,
        qty: "1",
        price: String(decimalToNumber(p.sellingPrice)),
      },
    ]);
    setSearch("");
    setResults([]);
  }

  const subtotal = lines.reduce(
    (s, l) => s + parseFloat(l.qty || "0") * parseFloat(l.price || "0"),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      notify.error("Add at least one product");
      return;
    }

    const data = validate();
    if (!data) return;

    const items = lines.map((l) => {
      const quantity = parseFloat(l.qty);
      const unitPrice = parseFloat(l.price);
      return {
        productId: l.productId,
        quantity,
        unitPrice,
        discount: 0,
        tax: 0,
        total: quantity * unitPrice,
      };
    });

    const total = subtotal;
    const paid = data.paidAmount ? parseFloat(data.paidAmount) : total;

    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerId: data.customerId === "walk-in" ? null : data.customerId,
          subtotal: total,
          discount: 0,
          tax: 0,
          total,
          paidAmount: paid,
          paymentMethod: data.paymentMethod,
          notes: data.notes ? `[Manual] ${data.notes}` : "[Manual sale]",
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success(`Sale ${resData.invoiceNo} created`);
      router.push(`/dashboard/sales/${resData.id}`);
      router.refresh();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Add products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <FormInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, barcode..."
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleSearch())
              }
            />
            <Button type="button" variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>
          {results.length > 0 && (
            <ul className="border rounded-md divide-y max-h-40 overflow-y-auto">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => addLine(p)}
                  >
                    {p.name} — stock {decimalToNumber(p.stockQty)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {lines.map((line, idx) => (
            <div key={line.productId} className="flex gap-2 items-center">
              <span className="flex-1 text-sm font-medium truncate">
                {line.name}
              </span>
              <FormInput
                type="number"
                min="0.001"
                step="any"
                className="w-20"
                value={line.qty}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx].qty = e.target.value;
                  setLines(next);
                }}
              />
              <FormInput
                type="number"
                step="0.01"
                className="w-24"
                value={line.price}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx].price = e.target.value;
                  setLines(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines(lines.filter((_, i) => i !== idx))}
              >
                ×
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormSelect2
            label="Customer"
            htmlFor="customerId"
            options={customerOptions}
            value={values.customerId}
            onChange={(v) => setField("customerId", v)}
            placeholder="Walk-in"
            error={fieldError("customerId")}
          />
          <FormSelect2
            label="Payment method"
            htmlFor="paymentMethod"
            required
            options={PAYMENT_METHOD_OPTIONS}
            value={values.paymentMethod}
            onChange={(v) => setField("paymentMethod", v)}
            error={fieldError("paymentMethod")}
          />
          <FormField label="Total">
            <FormInput value={subtotal.toFixed(2)} readOnly />
          </FormField>
          <FormField
            label="Paid amount"
            htmlFor="paidAmount"
            error={fieldError("paidAmount")}
          >
            <FormInput
              id="paidAmount"
              name="paidAmount"
              type="number"
              step="0.01"
              value={values.paidAmount}
              error={fieldError("paidAmount")}
              onChange={(e) => setField("paidAmount", e.target.value)}
              placeholder={subtotal.toFixed(2)}
            />
          </FormField>
          <FormField
            label="Notes"
            htmlFor="notes"
            className="sm:col-span-2"
            error={fieldError("notes")}
          >
            <FormInput
              id="notes"
              name="notes"
              value={values.notes}
              error={fieldError("notes")}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Saving..." : `Complete sale — ৳${subtotal.toFixed(2)}`}
      </Button>
    </form>
  );
}
