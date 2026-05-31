import { NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const authResult = await requireTenantSession();
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { subject, message, priority } = await request.json();

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Subject and message required" },
      { status: 400 }
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId,
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || "medium",
      status: "open",
    },
  });

  return NextResponse.json(ticket);
}
