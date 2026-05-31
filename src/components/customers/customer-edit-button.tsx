"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { customerEditSchema } from "@/lib/schemas/forms";
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
import { Pencil } from "lucide-react";
import type { SerializedCustomerEdit } from "@/lib/serialize";

const CUSTOMER_TYPE_OPTIONS = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
];

export function CustomerEditButton({
  customer,
}: {
  customer: SerializedCustomerEdit;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      customerType: customer.customerType,
    },
    customerEditSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      notify.success("Customer updated");
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
          <DialogTitle>Edit Customer</DialogTitle>
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
          <FormSelect2
            label="Type"
            htmlFor="customerType"
            required
            options={CUSTOMER_TYPE_OPTIONS}
            value={values.customerType}
            onChange={(v) => setField("customerType", v)}
            error={fieldError("customerType")}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Update"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
