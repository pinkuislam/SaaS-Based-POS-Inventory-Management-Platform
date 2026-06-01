import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { tenantDashboardPath } from "@/lib/tenant-path";

export function DashboardSubscriptionCard({
  tenantSlug,
  packageName,
  status,
  endDate,
  billingCycle,
}: {
  tenantSlug: string;
  packageName: string | null;
  status: string | null;
  endDate: Date | null;
  billingCycle: string | null;
}) {
  const isExpiringSoon =
    endDate &&
    endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
    endDate.getTime() > Date.now();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Subscription
        </CardTitle>
        {status && (
          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
            {status}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Package</span>
          <span className="font-medium">{packageName || "No active plan"}</span>
        </div>
        {billingCycle && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Billing</span>
            <span className="capitalize">{billingCycle}</span>
          </div>
        )}
        {endDate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Renews / expires</span>
            <span className={isExpiringSoon ? "text-amber-600 font-medium" : ""}>
              {formatDate(endDate)}
            </span>
          </div>
        )}
        {isExpiringSoon && (
          <p className="text-xs text-amber-600">
            Your subscription expires within 7 days.
          </p>
        )}
        <Link href={tenantDashboardPath(tenantSlug, "/subscription")}>
          <Button variant="outline" size="sm" className="w-full">
            Manage subscription
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
