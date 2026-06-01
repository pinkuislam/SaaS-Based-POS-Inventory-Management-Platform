import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { serializeCoupon } from "@/lib/serialize";
import { CouponFormDialog } from "@/components/admin/coupon-form-dialog";
import { CouponsList } from "@/components/admin/lists/coupons-list";

export default async function CouponsPage() {
  const [coupons, packages] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { package: { select: { name: true } } },
    }),
    prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

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
          <CouponsList
            coupons={coupons.map(serializeCoupon)}
            packages={packages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
