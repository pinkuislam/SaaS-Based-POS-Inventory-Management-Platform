import { MaintenancePanel } from "@/components/admin/maintenance-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Maintenance</h1>
        <p className="text-muted-foreground">
          Maintenance mode, cache, and operational controls
        </p>
      </div>
      <MaintenancePanel />
      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Subscription expiry cron: <code>/api/cron/subscriptions</code></p>
          <p>Queue jobs and server health monitoring can be wired to your hosting panel.</p>
          <p>Application logs: check your deployment provider (Vercel, Laragon, etc.).</p>
        </CardContent>
      </Card>
    </div>
  );
}
