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
import { formatDate, decimalToNumber } from "@/lib/utils";
import { serializeCoupon } from "@/lib/serialize";
import { CouponFormDialog } from "@/components/admin/coupon-form-dialog";
import { DeleteButton } from "@/components/admin/simple-crud-actions";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { package: { select: { name: true } } },
  });
  const packages = await prisma.subscriptionPackage.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons & Discounts</h1>
          <p className="text-muted-foreground">Manage subscription discount codes</p>
        </div>
        <CouponFormDialog packages={packages} />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.discountType}</TableCell>
                  <TableCell>{decimalToNumber(c.discountValue)}</TableCell>
                  <TableCell>{c.package?.name || "All"}</TableCell>
                  <TableCell>
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </TableCell>
                  <TableCell>
                    {c.expiryDate ? formatDate(c.expiryDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <CouponFormDialog
                      packages={packages}
                      coupon={serializeCoupon(c)}
                      mode="edit"
                    />
                    <DeleteButton url={`/api/admin/coupons/${c.id}`} />
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
