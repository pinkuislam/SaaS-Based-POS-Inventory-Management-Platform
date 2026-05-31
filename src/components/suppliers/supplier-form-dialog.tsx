"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { supplierFormSchema } from "@/lib/schemas/forms";
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
import { Plus } from "lucide-react";

export function SupplierFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      name: "",
      companyName: "",
      phone: "",
      email: "",
      address: "",
      openingBalance: "",
    },
    supplierFormSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          openingBalance: parseFloat(data.openingBalance || "0") || 0,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Supplier added");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      notify.error("Failed to add supplier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add Supplier
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
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
          <FormField
            label="Company"
            htmlFor="companyName"
            error={fieldError("companyName")}
          >
            <FormInput
              id="companyName"
              name="companyName"
              value={values.companyName}
              error={fieldError("companyName")}
              onChange={(e) => setField("companyName", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Phone"
              htmlFor="phone"
              error={fieldError("phone")}
            >
              <FormInput
                id="phone"
                name="phone"
                value={values.phone}
                error={fieldError("phone")}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </FormField>
            <FormField
              label="Email"
              htmlFor="email"
              error={fieldError("email")}
            >
              <FormInput
                id="email"
                name="email"
                type="email"
                value={values.email}
                error={fieldError("email")}
                onChange={(e) => setField("email", e.target.value)}
              />
            </FormField>
          </div>
          <FormField
            label="Opening Balance"
            htmlFor="openingBalance"
            error={fieldError("openingBalance")}
          >
            <FormInput
              id="openingBalance"
              name="openingBalance"
              type="number"
              step="0.01"
              value={values.openingBalance}
              error={fieldError("openingBalance")}
              onChange={(e) => setField("openingBalance", e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Supplier"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
