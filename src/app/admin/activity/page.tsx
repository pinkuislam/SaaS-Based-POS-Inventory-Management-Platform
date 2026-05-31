import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { ActivityArchiveButton } from "@/components/admin/activity-archive-button";

export default async function ActivityPage() {
  const logs = await prisma.platformActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">Platform admin and system activity (view & archive)</p>
        </div>
        <ActivityArchiveButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.admin?.name || log.adminName || "System"}
                  </TableCell>
                  <TableCell>{log.module}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {log.details || "—"}
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
