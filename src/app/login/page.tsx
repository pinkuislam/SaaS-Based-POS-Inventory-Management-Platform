"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "@/lib/auth-client";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { notify } from "@/lib/notify";
import { loginSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import { FormField, FormInput } from "@/components/ui/form-field";
import { LoginCard } from "@/components/auth/login-card";

function TenantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";
  const loginError = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError } = useValidatedForm(
    {
      email: "owner@demoshop.com",
      password: "password123",
    },
    loginSchema
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);

    const check = await fetch(
      `/api/auth/check?email=${encodeURIComponent(data.email)}&type=tenant`
    );
    const status = await check.json();
    if (!status.ok && status.message) {
      setLoading(false);
      notify.error(status.message);
      return;
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      loginType: "tenant",
      tenantSlug,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      notify.error("Invalid email or password");
      return;
    }

    notify.success("Welcome back!");
    const session = await getSession();
    const slug = session?.user?.tenantSlug || tenantSlug || "demo-shop";
    router.push(tenantDashboardPath(slug));
    router.refresh();
  }

  return (
    <LoginCard
      title="Business sign in"
      description={
        tenantSlug
          ? `Sign in to ${tenantSlug}`
          : "Access your store dashboard, POS, and inventory"
      }
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register your business
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Platform operator?{" "}
            <Link
              href="/admin/login"
              className="text-primary hover:underline"
            >
              Super Admin sign in
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Demo: owner@demoshop.com / password123
          </p>
        </>
      }
    >
      {loginError === "wrong-tenant" && (
        <p className="text-sm text-destructive text-center mb-4">
          This account does not belong to this business URL.
        </p>
      )}
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
            autoComplete="email"
          />
        </FormField>
        <FormField
          label="Password"
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
            autoComplete="current-password"
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in to dashboard"}
        </Button>
        <p className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </form>
    </LoginCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <TenantLoginForm />
    </Suspense>
  );
}
