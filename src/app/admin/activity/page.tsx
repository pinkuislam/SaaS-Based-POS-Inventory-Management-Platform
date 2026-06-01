import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityArchiveButton } from "@/components/admin/activity-archive-button";
import { ActivityList } from "@/components/admin/lists/activity-list";

export default async function ActivityPage() {
  const logs = await prisma.platformActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { name: true, email: true } } },
  });

  const rows = logs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    adminName: log.admin?.name || log.adminName || "System",
    module: log.module,
    action: log.action,
    details: log.details,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">
            Platform admin and system activity (view & archive)
          </p>
        </div>
        <ActivityArchiveButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityList logs={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
