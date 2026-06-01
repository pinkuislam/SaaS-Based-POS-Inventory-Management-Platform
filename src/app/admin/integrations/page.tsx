import { prisma } from "@/lib/prisma";
import { SmtpSettingsForm } from "@/components/admin/smtp-settings-form";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import {
  WooCommerceTenantsTable,
  type WooTenantRow,
} from "@/components/admin/woocommerce-tenants-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function IntegrationsPage() {
  const [ecommerceSettings, tenantsWithout] = await Promise.all([
    prisma.ecommerceSetting.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.tenant.findMany({
      where: {
        deletedAt: null,
        ecommerceSettings: { none: {} },
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 15,
    }),
  ]);

  const connections: WooTenantRow[] = ecommerceSettings.map((s) => ({
    id: s.id,
    tenantId: s.tenantId,
    tenantName: s.tenant.name,
    tenantSlug: s.tenant.slug,
    platform: s.platform,
    storeUrl: s.storeUrl,
    isActive: s.isActive,
    syncProducts: s.syncProducts,
    syncStock: s.syncStock,
    syncOrders: s.syncOrders,
    lastProductSync: s.lastProductSync?.toISOString() ?? null,
    lastOrderSync: s.lastOrderSync?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API & Integrations</h1>
        <p className="text-muted-foreground">
          Email gateway, payment gateways, tenant e-commerce, and platform APIs
        </p>
      </div>

      <SmtpSettingsForm />

      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <CardDescription>
            Stripe and SSLCommerz for tenant subscription checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentSettingsForm />
        </CardContent>
      </Card>

      <WooCommerceTenantsTable
        connections={connections}
        tenantsWithout={tenantsWithout}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tenant REST API</CardTitle>
          <CardDescription>
            Per-tenant API keys are managed in each business Settings panel
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <code className="rounded bg-muted px-1">GET /api/v1/products</code>
          </p>
          <p>
            <code className="rounded bg-muted px-1">POST /api/v1/sales</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
