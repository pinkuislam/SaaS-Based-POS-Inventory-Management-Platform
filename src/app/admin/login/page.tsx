"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { notify } from "@/lib/notify";
import { adminLoginSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { LoginCard } from "@/components/auth/login-card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requiresTotp, setRequiresTotp] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      email: "admin@platform.com",
      password: "password123",
      totp: "",
    },
    adminLoginSchema
  );

  useEffect(() => {
    if (!values.email.includes("@")) return;
    const t = setTimeout(() => {
      fetch("/api/admin/auth/check-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      })
        .then((r) => r.json())
        .then((d) => setRequiresTotp(!!d.requiresTotp))
        .catch(() => setRequiresTotp(false));
    }, 400);
    return () => clearTimeout(t);
  }, [values.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    if (requiresTotp && !data.totp?.trim()) {
      notify.error("Enter your authenticator code");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      loginType: "admin",
      tenantSlug: "",
      totpCode: requiresTotp ? data.totp || "" : "",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      notify.error(
        requiresTotp
          ? "Invalid credentials or 2FA code"
          : "Invalid admin email or password"
      );
      return;
    }

    notify.success("Welcome, Super Admin");
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <LoginCard
      title="Super Admin sign in"
      description="Platform control panel — tenants, packages, billing, and support"
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Business owner?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Business sign in
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Demo: admin@platform.com / password123
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Admin email"
          htmlFor="admin-email"
          required
          error={fieldError("email")}
        >
          <FormInput
            id="admin-email"
            name="email"
            type="email"
            value={values.email}
            error={fieldError("email")}
            onChange={(e) => setField("email", e.target.value)}
            autoComplete="email"
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="admin-password"
          required
          error={fieldError("password")}
        >
          <FormInput
            id="admin-password"
            name="password"
            type="password"
            value={values.password}
            error={fieldError("password")}
            onChange={(e) => setField("password", e.target.value)}
            autoComplete="current-password"
          />
        </FormField>
        {requiresTotp && (
          <FormField
            label="Authenticator code"
            htmlFor="admin-totp"
            error={fieldError("totp")}
          >
            <FormInput
              id="admin-totp"
              name="totp"
              value={values.totp}
              error={fieldError("totp")}
              onChange={(e) => setField("totp", e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </FormField>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in to admin panel"}
        </Button>
      </form>
    </LoginCard>
  );
}
