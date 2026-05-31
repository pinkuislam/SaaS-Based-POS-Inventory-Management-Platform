"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "@/lib/auth-client";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginCard } from "@/components/auth/login-card";

function TenantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") || "";
  const loginError = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("owner@demoshop.com");
  const [password, setPassword] = useState("password123");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const check = await fetch(
      `/api/auth/check?email=${encodeURIComponent(email)}&type=tenant`
    );
    const status = await check.json();
    if (!status.ok && status.message) {
      setLoading(false);
      toast.error(status.message);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      loginType: "tenant",
      tenantSlug,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    toast.success("Welcome back!");
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
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
