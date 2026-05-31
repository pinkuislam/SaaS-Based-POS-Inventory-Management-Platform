import { prisma } from "@/lib/prisma";
import { Security2faPanel } from "@/components/admin/security-2fa-panel";
import { SecurityIpPanel } from "@/components/admin/security-ip-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function SecurityPage() {
  const [failedLogins, tenantLogins] = await Promise.all([
    prisma.loginLog.findMany({
      where: { success: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { tenant: { select: { name: true } } },
    }),
    prisma.loginLog.findMany({
      where: { success: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { tenant: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground">
          Login attempts, session policy (configure in Settings)
        </p>
      </div>

      <Security2faPanel />
      <SecurityIpPanel />

      <Card>
        <CardHeader>
          <CardTitle>Failed Login Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedLogins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No failed attempts recorded
                  </TableCell>
                </TableRow>
              ) : (
                failedLogins.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>{l.tenant?.name || "—"}</TableCell>
                    <TableCell>{l.ip || "—"}</TableCell>
                    <TableCell>{formatDate(l.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Successful Logins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantLogins.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.email}</TableCell>
                  <TableCell>
                    {l.tenant?.name || (
                      <Badge variant="outline">Platform</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(l.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
