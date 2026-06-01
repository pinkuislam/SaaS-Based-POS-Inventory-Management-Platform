import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma, bcrypt, or MariaDB).
 * Used by middleware. Full providers live in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.branchId = user.branchId;
        token.role = user.role;
        token.permissions = user.permissions;
        token.impersonatedBy = user.impersonatedBy;
        token.impersonatedByName = user.impersonatedByName;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.userType = token.userType as string;
        session.user.tenantId = token.tenantId as string | null;
        session.user.tenantSlug = token.tenantSlug as string | null;
        session.user.tenantName = token.tenantName as string | null;
        session.user.branchId = token.branchId as string | null;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.impersonatedBy = token.impersonatedBy as string | undefined;
        session.user.impersonatedByName = token.impersonatedByName as
          | string
          | undefined;
        session.user.mustChangePassword = token.mustChangePassword as
          | boolean
          | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
