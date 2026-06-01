import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serializeSubscriptionPayment } from "@/lib/serialize";
import { PaymentFormDialog } from "@/components/admin/payment-form-dialog";
import { PaymentsList } from "@/components/admin/lists/payments-list";

export default async function PaymentsPage() {
  const [payments, subscriptions] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        subscription: {
          include: { tenant: true, package: true },
        },
      },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: true, package: true },
    }),
  ]);

  const subscriptionOptions = subscriptions.map((s) => ({
    id: s.id,
    label: `${s.tenant.name} — ${s.package.name}`,
  }));

  const rows = payments.map((p) => ({
    ...serializeSubscriptionPayment(p),
    tenantName: p.subscription.tenant.name,
    packageName: p.subscription.package.name,
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Payments</h1>
          <p className="text-muted-foreground">
            Platform billing and payment records
          </p>
        </div>
        <PaymentFormDialog subscriptions={subscriptionOptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentsList
            payments={rows}
            subscriptionOptions={subscriptionOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
