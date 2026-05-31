"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { notify } from "@/lib/notify";
import { resetPasswordSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      password: "",
      confirmPassword: "",
    },
    resetPasswordSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      notify.error("Invalid reset link");
      return;
    }

    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      notify.success("Password updated. You can sign in now.");
      window.location.href = "/login";
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="New Password"
        htmlFor="password"
        required
        error={fieldError("password")}
      >
        <FormInput
          id="password"
          name="password"
          type="password"
          value={values.password}
          error={fieldError("password")}
          onChange={(e) => setField("password", e.target.value)}
        />
      </FormField>
      <FormField
        label="Confirm Password"
        htmlFor="confirmPassword"
        required
        error={fieldError("confirmPassword")}
      >
        <FormInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          error={fieldError("confirmPassword")}
          onChange={(e) => setField("confirmPassword", e.target.value)}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={loading || !token}>
        {loading ? "Updating..." : "Reset Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm">Loading...</p>}>
            <ResetForm />
          </Suspense>
          <Link
            href="/login"
            className="text-sm text-primary block mt-4 text-center"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
