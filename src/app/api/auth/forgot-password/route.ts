import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: email.trim(), userType: "TENANT", isActive: true },
  });

  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        email: email.trim(),
        token,
        expiresAt: addHours(new Date(), 2),
      },
    });
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const result = await sendPasswordResetEmail({ to: email.trim(), resetUrl });
    if (!result.sent) {
      console.info(`[Password Reset] ${email}: ${resetUrl}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: "If the email exists, reset instructions were sent.",
  });
}
