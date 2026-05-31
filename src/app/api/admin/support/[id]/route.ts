import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      tenant: true,
      assignedAdmin: { select: { id: true, name: true, email: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.priority) data.priority = body.priority;
  if (body.category) data.category = body.category;
  if (body.assignedAdminId !== undefined) data.assignedAdminId = body.assignedAdminId;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data,
  });

  if (body.reply) {
    await prisma.supportTicketReply.create({
      data: {
        ticketId: id,
        authorType: "admin",
        authorName: auth.session.user.name || "Admin",
        message: body.reply,
        isInternal: body.isInternal ?? false,
      },
    });
  }

  return NextResponse.json(ticket);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.supportTicket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
