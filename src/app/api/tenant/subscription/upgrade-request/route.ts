import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const body = await request.json();
  const requestType = body.type === "downgrade" ? "downgrade" : "upgrade";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const targetPackage =
    typeof body.targetPackage === "string" ? body.targetPackage.trim() : "";

  await prisma.notification.create({
    data: {
      tenantId,
      type: "subscription_request",
      title: `Package ${requestType} requested`,
      message: [
        targetPackage ? `Requested package: ${targetPackage}` : null,
        message || null,
        "A platform administrator will review your request.",
      ]
        .filter(Boolean)
        .join(" — "),
      link: "/dashboard/subscription",
    },
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: `request_${requestType}`,
    module: "subscription",
    details: targetPackage || message || requestType,
  });

  return NextResponse.json({
    success: true,
    message: "Your request has been recorded. Our team will contact you.",
  });
}
