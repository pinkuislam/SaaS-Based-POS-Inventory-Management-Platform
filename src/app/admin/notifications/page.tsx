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
import { BroadcastFormDialog } from "@/components/admin/broadcast-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function NotificationsPage() {
  const broadcasts = await prisma.platformBroadcast.findMany({
    orderBy: { createdAt: "desc" },
  });

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.channel}</TableCell>
                  <TableCell>
                    <Badge>{b.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {b.sentAt ? formatDate(b.sentAt) : "—"}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <BroadcastFormDialog
                      broadcast={{
                        id: b.id,
                        title: b.title,
                        message: b.message,
                        status: b.status,
                      }}
                      mode="edit"
                    />
                    <DeleteButton url={`/api/admin/broadcasts/${b.id}`} />
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
