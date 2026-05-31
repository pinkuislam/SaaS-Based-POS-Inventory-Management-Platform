import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { AnnouncementFormDialog } from "@/components/admin/announcement-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function AnnouncementsPage() {
  const items = await prisma.platformAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
  });

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>
                    <Badge>{a.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {a.publishedAt ? formatDate(a.publishedAt) : "—"}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <AnnouncementFormDialog announcement={a} mode="edit" />
                    <DeleteButton url={`/api/admin/announcements/${a.id}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
