import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ActivityLogView } from "@/components/activity/activity-log-view";
import { LoginLogView } from "@/components/activity/login-log-view";

export default async function ActivityPage() {
  const tenantId = await getTenantId();
  const users = await prisma.user.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">
          Business activity, payments, stock transfers, and login history
        </p>
      </div>

      <ActivityLogView users={users} />
      <LoginLogView />
    </div>
  );
}
