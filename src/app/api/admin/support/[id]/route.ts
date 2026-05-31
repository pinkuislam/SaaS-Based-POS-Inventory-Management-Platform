import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.userType !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, priority } = await request.json();

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(priority && { priority }),
    },
  });

  return NextResponse.json(ticket);
}
