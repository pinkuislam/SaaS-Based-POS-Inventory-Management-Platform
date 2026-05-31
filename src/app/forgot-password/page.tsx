"use client";

import { useState } from "react";
import Link from "next/link";
import { notify } from "@/lib/notify";
import { forgotPasswordSchema } from "@/lib/schemas/forms";
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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    { email: "" },
    forgotPasswordSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const resData = await res.json();
      notify.success(resData.message);
    } catch {
      notify.error("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email. In development, check the server console for the
            reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField
              label="Email"
              htmlFor="email"
              required
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
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
