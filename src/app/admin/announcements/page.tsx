import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementFormDialog } from "@/components/admin/announcement-form-dialog";
import { AnnouncementsList } from "@/components/admin/lists/announcements-list";

export default async function AnnouncementsPage() {
  const items = await prisma.platformAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = items.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    targetType: a.targetType,
    status: a.status,
    publishedAt: a.publishedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Platform-wide notices for tenants</p>
        </div>
        <AnnouncementFormDialog />
      </div>
      <Card>
        <CardContent className="pt-6">
          <AnnouncementsList items={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
