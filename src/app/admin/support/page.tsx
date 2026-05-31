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
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TicketActions } from "@/components/admin/ticket-actions";
import { Button } from "@/components/ui/button";

export default async function SupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: { tenant: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">Tenant support requests</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No support tickets yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.tenant.name}</TableCell>
                    <TableCell>
                      <div>
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticket.subject}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {ticket.message}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/admin/support/${ticket.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                        <TicketActions
                          ticketId={ticket.id}
                          status={ticket.status}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
