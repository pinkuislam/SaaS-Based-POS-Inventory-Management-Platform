"use client";

import { useEffect, useState } from "react";
import { FormField, FormInput, FormSelect2 } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
export type BranchFormValues = {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  openingBalance: string;
  managerId: string;
  isMain: boolean;
  isActive: boolean;
  invoicePrefix: string;
  settingsNotes: string;
};

type UserOption = { id: string; name: string };

export function BranchFormFields({
  values,
  setField,
  fieldError,
  showMainToggle = true,
  showStatusToggle = false,
}: {
  values: BranchFormValues;
  setField: <K extends keyof BranchFormValues>(
    key: K,
    value: BranchFormValues[K]
  ) => void;
  fieldError: (key: keyof BranchFormValues) => string | undefined;
  showMainToggle?: boolean;
  showStatusToggle?: boolean;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(
            data
              .filter((u: { isActive?: boolean }) => u.isActive !== false)
              .map((u: { id: string; name: string }) => ({
                id: u.id,
                name: u.name,
              }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Name" htmlFor="name" required error={fieldError("name")}>
          <FormInput
            id="name"
            value={values.name}
            error={fieldError("name")}
            onChange={(e) => setField("name", e.target.value)}
          />
        </FormField>
        <FormField label="Code" htmlFor="code" error={fieldError("code")}>
          <FormInput
            id="code"
            value={values.code}
            placeholder="BR-02"
            onChange={(e) => setField("code", e.target.value)}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Contact person" htmlFor="contactPerson">
          <FormInput
            id="contactPerson"
            value={values.contactPerson}
            onChange={(e) => setField("contactPerson", e.target.value)}
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={fieldError("phone")}>
          <FormInput
            id="phone"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </FormField>
      </div>
      <FormField label="Email" htmlFor="email" error={fieldError("email")}>
        <FormInput
          id="email"
          type="email"
          value={values.email}
          error={fieldError("email")}
          onChange={(e) => setField("email", e.target.value)}
        />
      </FormField>
      <FormField label="Address" htmlFor="address">
        <FormInput
          id="address"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Opening balance"
          htmlFor="openingBalance"
          error={fieldError("openingBalance")}
        >
          <FormInput
            id="openingBalance"
            type="number"
            min="0"
            step="0.01"
            value={values.openingBalance}
            error={fieldError("openingBalance")}
            onChange={(e) => setField("openingBalance", e.target.value)}
          />
        </FormField>
        <FormSelect2
          label="Branch manager"
          options={[
            { value: "", label: "None" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
          value={values.managerId || ""}
          onChange={(v) => setField("managerId", v)}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Invoice prefix (settings)" htmlFor="invoicePrefix">
          <FormInput
            id="invoicePrefix"
            value={values.invoicePrefix}
            placeholder="BR1-"
            onChange={(e) => setField("invoicePrefix", e.target.value)}
          />
        </FormField>
        <FormField label="Branch notes (settings)" htmlFor="settingsNotes">
          <FormInput
            id="settingsNotes"
            value={values.settingsNotes}
            onChange={(e) => setField("settingsNotes", e.target.value)}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap gap-4">
        {showMainToggle ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.isMain}
              onCheckedChange={(c) => setField("isMain", c === true)}
            />
            <Label className="font-normal">Main branch</Label>
          </label>
        ) : null}
        {showStatusToggle ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={values.isActive}
              onCheckedChange={(c) => setField("isActive", c === true)}
            />
            <Label className="font-normal">Active branch</Label>
          </label>
        ) : null}
      </div>
    </div>
  );
}
