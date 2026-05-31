import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
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

export default async function BranchesPage() {
  const tenantId = await getTenantId();
  const branches = await prisma.branch.findMany({
    where: { tenantId },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branches</h1>
        <p className="text-muted-foreground">Multi-branch management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Branch List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.code || "—"}</TableCell>
                  <TableCell>{b.phone || "—"}</TableCell>
                  <TableCell>{b._count.users}</TableCell>
                  <TableCell>
                    {b.isMain && <Badge>Main</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.isActive ? "default" : "secondary"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
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
