import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { SupportList } from "@/components/admin/lists/support-list";

export default async function SupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: { tenant: true },
  });

  const rows = tickets.map((ticket) => ({
    id: ticket.id,
    tenantName: ticket.tenant.name,
    subject: ticket.subject,
    message: ticket.message,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">Tenant support requests</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SupportList tickets={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
