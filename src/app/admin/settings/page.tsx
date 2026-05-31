import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Platform-wide configuration</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
          <CardDescription>
            Configure payment gateways, email settings, and system defaults.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            System settings can be extended to include Stripe, SSLCommerz,
            SMTP configuration, and feature flags per package.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
