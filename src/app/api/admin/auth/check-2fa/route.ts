import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ requiresTotp: false });
  }

  const admin = await prisma.superAdmin.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    select: { totpEnabled: true, isActive: true },
  });

  return NextResponse.json({
    requiresTotp: !!(admin?.isActive && admin.totpEnabled),
  });
}
