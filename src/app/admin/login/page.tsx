"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginCard } from "@/components/auth/login-card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("admin@platform.com");
  const [password, setPassword] = useState("password123");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      loginType: "admin",
      tenantSlug: "",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Invalid admin email or password");
      return;
    }

    toast.success("Welcome, Super Admin");
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email">Admin email</Label>
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in to admin panel"}
        </Button>
      </form>
    </LoginCard>
  );
}
