import { getTenantId, getTenantSlug } from "@/lib/tenant";
import { getBusinessProfile } from "@/lib/business-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BusinessProfileView } from "@/components/settings/business-profile-view";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";
import { AccountDeletionRequest } from "@/components/settings/account-deletion-request";
import Link from "next/link";
import { tenantDashboardPath } from "@/lib/tenant-path";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default async function BusinessProfilePage() {
  const tenantId = await getTenantId();
  const tenantSlug = await getTenantSlug();
  const profile = await getBusinessProfile(tenantId);

  if (!profile) {
    return (
      <p className="text-muted-foreground">Business profile not found.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground">
            Company information, owner details, and regional defaults
          </p>
        </div>
        <Link href={tenantDashboardPath(tenantSlug, "/settings")}>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            All settings
          </Button>
        </Link>
      </div>

      <BusinessProfileView profile={profile} tenantSlug={tenantSlug} />

      <Card>
        <CardHeader>
          <CardTitle>Edit business profile</CardTitle>
          <CardDescription>
            Update company name, logo, contact details, tax/VAT number, invoice
            prefix, currency, and timezone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessProfileForm profile={profile} />
        </CardContent>
      </Card>

      <AccountDeletionRequest businessName={profile.name} />
    </div>
  );
}
