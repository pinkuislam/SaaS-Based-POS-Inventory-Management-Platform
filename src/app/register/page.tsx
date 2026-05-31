"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { registerFormSchema } from "@/lib/schemas/forms";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormInput,
  FormSelect2,
} from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PACKAGE_OPTIONS = [
  { value: "starter", label: "Starter - ৳999/mo" },
  { value: "business", label: "Business - ৳2,499/mo" },
  { value: "enterprise", label: "Enterprise - ৳4,999/mo" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { values, setField, validate, fieldError, setValues } =
    useValidatedForm(
      {
        businessName: "",
        slug: "",
        ownerName: "",
        email: "",
        phone: "",
        password: "",
        packageSlug: "starter",
      },
      registerFormSchema
    );

  function updateField(field: keyof typeof values, value: string) {
    setValues((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "businessName" && !prev.slug && value) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-");
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const resData = await res.json();

      if (!res.ok) {
        notify.error(resData.error || "Registration failed");
        return;
      }

      notify.success(
        "Registration submitted! Your account is pending Super Admin approval before you can sign in."
      );
      router.push("/login");
    } catch {
      notify.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Link href="/" className="text-2xl font-bold mb-2 block">
            Inventory<span className="text-primary">POS</span>
          </Link>
          <CardTitle>Register Your Business</CardTitle>
          <CardDescription>
            Start your free trial. Your account will be activated after review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                label="Business Name"
                htmlFor="businessName"
                required
                error={fieldError("businessName")}
                className="sm:col-span-2"
              >
                <FormInput
                  id="businessName"
                  name="businessName"
                  value={values.businessName}
                  error={fieldError("businessName")}
                  onChange={(e) => updateField("businessName", e.target.value)}
                />
              </FormField>
              <FormField
                label="Business URL Slug"
                htmlFor="slug"
                required
                error={fieldError("slug")}
                className="sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">
                    app.com/
                  </span>
                  <FormInput
                    id="slug"
                    name="slug"
                    value={values.slug}
                    error={fieldError("slug")}
                    onChange={(e) => updateField("slug", e.target.value)}
                  />
                </div>
              </FormField>
              <FormField
                label="Owner Name"
                htmlFor="ownerName"
                required
                error={fieldError("ownerName")}
              >
                <FormInput
                  id="ownerName"
                  name="ownerName"
                  value={values.ownerName}
                  error={fieldError("ownerName")}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                />
              </FormField>
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
                required
                error={fieldError("email")}
                className="sm:col-span-2"
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
              <FormField
                label="Password"
                htmlFor="password"
                required
                error={fieldError("password")}
                className="sm:col-span-2"
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
              <FormSelect2
                label="Package"
                htmlFor="packageSlug"
                required
                options={PACKAGE_OPTIONS}
                value={values.packageSlug}
                onChange={(v) => setField("packageSlug", v)}
                error={fieldError("packageSlug")}
                className="sm:col-span-2"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline ml-1">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
