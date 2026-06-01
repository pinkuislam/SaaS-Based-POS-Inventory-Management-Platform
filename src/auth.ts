import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyImpersonationToken } from "@/lib/admin/impersonation";
import { verifyTotpCode } from "@/lib/admin/totp";
import { isAdminIpAllowed } from "@/lib/admin/ip-restrict";
import { clientIpFromRequest, logLoginAttempt } from "@/lib/login-log";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        loginType: { label: "Login Type", type: "text" },
        tenantSlug: { label: "Tenant Slug", type: "text" },
        impersonateToken: { label: "Impersonate Token", type: "text" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials, request) {
        const loginType = (credentials?.loginType as string) || "tenant";

        if (loginType === "impersonate") {
          const token = credentials?.impersonateToken as string;
          if (!token) return null;
          const payload = verifyImpersonationToken(token);
          if (!payload) return null;

          const user = await prisma.user.findFirst({
            where: {
              id: payload.userId,
              tenantId: payload.tenantId,
              userType: "TENANT",
              isActive: true,
              deletedAt: null,
            },
            include: { tenant: true, role: true },
          });
          if (!user?.tenant || user.tenant.status !== "ACTIVE") return null;
          if (user.tenant.loginBlocked) return null;

          const { resolveUserPermissions } = await import("@/lib/permissions");
          const permissions = resolveUserPermissions(
            user.role?.permissions,
            user.extraPermissions
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: "TENANT",
            tenantId: user.tenantId,
            tenantSlug: user.tenant.slug,
            tenantName: user.tenant.name,
            branchId: user.branchId,
            role: user.role?.name || "User",
            permissions,
            impersonatedBy: payload.adminId,
            impersonatedByName: payload.adminName,
          };
        }

        if (loginType === "admin") {
          if (request && !(await isAdminIpAllowed(request))) {
            return null;
          }

          const email = credentials?.email as string;
          const password = credentials?.password as string;
          const totpCode = (credentials?.totpCode as string) || "";

          if (!email || !password) return null;

          const admin = await prisma.superAdmin.findUnique({
            where: { email },
          });
          if (!admin || !admin.isActive) return null;
          const valid = await bcrypt.compare(password, admin.password);
          if (!valid) return null;

          if (admin.totpEnabled && admin.totpSecret) {
            if (!totpCode || !(await verifyTotpCode(admin.totpSecret, totpCode))) {
              return null;
            }
          }

          await prisma.superAdmin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            userType: "SUPER_ADMIN",
            tenantId: null,
            tenantSlug: null,
            role: "Super Admin",
            permissions: ["*"],
          };
        }

        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const expectedSlug = (credentials.tenantSlug as string) || "";

        const user = await prisma.user.findFirst({
          where: {
            email,
            userType: "TENANT",
            isActive: true,
            deletedAt: null,
          },
          include: {
            tenant: true,
            role: true,
          },
        });

        const ip = request ? clientIpFromRequest(request) : null;
        const userAgent = request?.headers.get("user-agent") ?? null;

        if (!user || !user.tenant) {
          await logLoginAttempt({
            email,
            success: false,
            ip,
            userAgent,
          });
          return null;
        }
        if (user.tenant.status !== "ACTIVE") {
          await logLoginAttempt({
            email,
            success: false,
            userId: user.id,
            tenantId: user.tenantId,
            ip,
            userAgent,
          });
          return null;
        }
        if (user.tenant.loginBlocked) {
          await logLoginAttempt({
            email,
            success: false,
            userId: user.id,
            tenantId: user.tenantId,
            ip,
            userAgent,
          });
          return null;
        }

        if (expectedSlug && user.tenant.slug !== expectedSlug) {
          await logLoginAttempt({
            email,
            success: false,
            userId: user.id,
            tenantId: user.tenantId,
            ip,
            userAgent,
          });
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          await logLoginAttempt({
            email,
            success: false,
            userId: user.id,
            tenantId: user.tenantId,
            ip,
            userAgent,
          });
          return null;
        }

        const { resolveUserPermissions } = await import("@/lib/permissions");
        const permissions = resolveUserPermissions(
          user.role?.permissions,
          user.extraPermissions
        );

        await logLoginAttempt({
          email: user.email,
          success: true,
          userId: user.id,
          tenantId: user.tenantId,
          ip,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: "TENANT",
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          tenantName: user.tenant.name,
          branchId: user.branchId,
          role: user.role?.name || "User",
          permissions,
          mustChangePassword: user.mustChangePassword === true,
        };
      },
    }),
  ],
});
