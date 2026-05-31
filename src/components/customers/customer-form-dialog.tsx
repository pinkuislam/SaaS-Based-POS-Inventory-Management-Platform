"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { customerSchema } from "@/lib/schemas/forms";
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

const CUSTOMER_TYPE_OPTIONS = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
];

export function CustomerFormDialog({
  groups = [],
}: {
  groups?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      name: "",
      phone: "",
      email: "",
      address: "",
      customerType: "retail",
      openingBalance: "",
      creditLimit: "",
      groupId: "",
    },
    customerSchema
  );

  const groupOptions = [
    { value: "", label: "None" },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          openingBalance: parseFloat(data.openingBalance || "0") || 0,
          creditLimit: parseFloat(data.creditLimit || "0") || 0,
          groupId: data.groupId || null,
        }),
      });
      if (!res.ok) throw new Error();
      notify.success("Customer added");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      notify.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Add Customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
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
          <FormField label="Phone" htmlFor="phone" error={fieldError("phone")}>
            <FormInput
              id="phone"
              name="phone"
              value={values.phone}
              error={fieldError("phone")}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" error={fieldError("email")}>
            <FormInput
              id="email"
              name="email"
              type="email"
              value={values.email}
              error={fieldError("email")}
              onChange={(e) => setField("email", e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect2
              label="Type"
              htmlFor="customerType"
              required
              options={CUSTOMER_TYPE_OPTIONS}
              value={values.customerType}
              onChange={(v) => setField("customerType", v)}
              error={fieldError("customerType")}
            />
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
          </div>
          {groups.length > 0 && (
            <FormSelect2
              label="Customer Group"
              htmlFor="groupId"
              options={groupOptions}
              value={values.groupId}
              onChange={(v) => setField("groupId", v)}
              placeholder="None"
              error={fieldError("groupId")}
            />
          )}
          <FormField
            label="Credit Limit"
            htmlFor="creditLimit"
            error={fieldError("creditLimit")}
          >
            <FormInput
              id="creditLimit"
              name="creditLimit"
              type="number"
              step="0.01"
              value={values.creditLimit}
              error={fieldError("creditLimit")}
              onChange={(e) => setField("creditLimit", e.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
