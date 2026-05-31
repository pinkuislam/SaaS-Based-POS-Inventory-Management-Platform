import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SupportTicketThread } from "@/components/admin/support-ticket-thread";

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [ticket, admins] = await Promise.all([
    prisma.supportTicket.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } },
        replies: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.superAdmin.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) notFound();

  const serialized = {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    replies: ticket.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/support" className="text-sm text-muted-foreground hover:underline">
          ← Back to tickets
        </Link>
        <h1 className="text-2xl font-bold mt-2">{ticket.subject}</h1>
        <p className="text-muted-foreground">{ticket.tenant.name}</p>
      </div>
      <SupportTicketThread ticket={serialized} admins={admins} />
    </div>
  );
}
