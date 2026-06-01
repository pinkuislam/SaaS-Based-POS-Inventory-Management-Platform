import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Crown } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";
import {
  BUSINESS_TYPES,
  CURRENCIES,
  TIMEZONES,
} from "@/lib/constants/business";
import type { BusinessProfileData } from "@/lib/business-profile";

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function BusinessProfileView({
  profile,
  tenantSlug,
}: {
  profile: BusinessProfileData;
  tenantSlug: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {profile.logo ? (
              <Image
                src={profile.logo}
                alt={profile.name}
                width={120}
                height={120}
                className="rounded-lg border object-contain"
                unoptimized
              />
            ) : (
              <div className="h-28 w-28 rounded-lg border bg-muted flex items-center justify-center">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-lg">{profile.name}</p>
            <p>
              <span className="text-muted-foreground">Type: </span>
              {labelFor(BUSINESS_TYPES, profile.business.businessType)}
            </p>
            <p>
              <span className="text-muted-foreground">Slug: </span>
              <span className="font-mono">{profile.slug}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              <Badge variant="outline">{profile.status}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Owner & contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Owner</p>
            <p className="font-medium">{profile.ownerName || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Business email</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{profile.phone || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tax / VAT number</p>
            <p className="font-medium">
              {profile.business.taxVatNumber || "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Address</p>
            <p className="font-medium whitespace-pre-wrap">
              {profile.address || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Business settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Default currency</p>
            <p className="font-medium">
              {labelFor(CURRENCIES, profile.business.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Timezone</p>
            <p className="font-medium">
              {labelFor(TIMEZONES, profile.business.timezone)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Invoice prefix</p>
            <p className="font-medium font-mono">
              {profile.business.invoicePrefix}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Active tax rates</p>
            <p className="font-medium">{profile.taxesCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Default POS tax %</p>
            <p className="font-medium">
              {profile.pos?.defaultTaxRate ?? 0}%
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Receipt footer</p>
            <p className="font-medium">
              {profile.pos?.receiptFooter || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Package</span>
            <span className="font-medium">{profile.packageName || "—"}</span>
          </div>
          {profile.subscriptionStatus && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{profile.subscriptionStatus}</Badge>
            </div>
          )}
          {profile.subscriptionEndDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid until</span>
              <span>{formatDate(profile.subscriptionEndDate)}</span>
            </div>
          )}
          <Link href={tenantDashboardPath(tenantSlug, "/subscription")}>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Manage subscription
            </Button>
          </Link>
          <Link href={tenantDashboardPath(tenantSlug, "/settings")}>
            <Button variant="ghost" size="sm" className="w-full">
              Tax, invoice & security settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
