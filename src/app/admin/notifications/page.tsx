import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BroadcastFormDialog } from "@/components/admin/broadcast-form-dialog";
import { BroadcastsList } from "@/components/admin/lists/broadcasts-list";

export default async function NotificationsPage() {
  const broadcasts = await prisma.platformBroadcast.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = broadcasts.map((b) => ({
    id: b.id,
    title: b.title,
    message: b.message,
    channel: b.channel,
    status: b.status,
    sentAt: b.sentAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Send system notifications to tenants
          </p>
        </div>
        <BroadcastFormDialog />
      </div>
      <Card>
        <CardContent className="pt-6">
          <BroadcastsList broadcasts={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
