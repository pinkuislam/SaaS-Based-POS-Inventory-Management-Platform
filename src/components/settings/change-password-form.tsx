"use client";

import { useState } from "react";
import { notify } from "@/lib/notify";
import { changePasswordSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const { values, setField, validate, fieldError, reset } = useValidatedForm(
    {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
    changePasswordSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.password,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Password updated");
      reset();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md" noValidate>
      <FormField
        label="Current password"
        htmlFor="cur-pw"
        required
        error={fieldError("currentPassword")}
      >
        <FormInput
          id="cur-pw"
          type="password"
          value={values.currentPassword}
          onChange={(e) => setField("currentPassword", e.target.value)}
        />
      </FormField>
      <FormField
        label="New password"
        htmlFor="new-pw"
        required
        error={fieldError("password")}
      >
        <FormInput
          id="new-pw"
          type="password"
          value={values.password}
          onChange={(e) => setField("password", e.target.value)}
        />
      </FormField>
      <FormField
        label="Confirm new password"
        htmlFor="confirm-pw"
        required
        error={fieldError("confirmPassword")}
      >
        <FormInput
          id="confirm-pw"
          type="password"
          value={values.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Change Password"}
      </Button>
    </form>
  );
}
