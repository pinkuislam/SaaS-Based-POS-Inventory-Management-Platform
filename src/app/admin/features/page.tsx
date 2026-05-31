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
import { FeatureFormDialog } from "@/components/admin/feature-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function FeaturesPage() {
  const features = await prisma.platformFeature.findMany({
    orderBy: [{ module: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Package Features</h1>
          <p className="text-muted-foreground">
            Control platform features assignable to packages
          </p>
        </div>
        <FeatureFormDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Features ({features.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="font-mono text-xs">{f.key}</TableCell>
                  <TableCell>{f.module}</TableCell>
                  <TableCell>
                    <Badge variant={f.isActive ? "default" : "secondary"}>
                      {f.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <FeatureFormDialog feature={f} mode="edit" />
                    <DeleteButton url={`/api/admin/features/${f.id}`} />
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
