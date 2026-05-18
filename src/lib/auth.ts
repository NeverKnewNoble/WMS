import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify as argonVerify } from "@node-rs/argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      departmentId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid: string;
    role: string;
    departmentId: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user || user.deletedAt || user.status !== "active") return null;

        const valid = await argonVerify(user.passwordHash, password);
        if (!valid) return null;

        // Fire-and-forget last-login bump.
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id: user.id.toString(),
          name: user.fullName,
          email: user.email,
          role: user.role.code,
          departmentId: user.departmentId?.toString() ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        // @ts-expect-error - augmented by authorize() return shape
        token.role = user.role;
        // @ts-expect-error - augmented by authorize() return shape
        token.departmentId = user.departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) {
        session.user.id = token.uid;
        session.user.role = token.role;
        session.user.departmentId = token.departmentId ?? null;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const path = request.nextUrl.pathname;
      const onPortal = path.startsWith("/portal");
      const onAuth   = path.startsWith("/auth");

      if (onPortal && !session) return false; // forces redirect to /auth/login
      if (onAuth && session) {
        return Response.redirect(new URL("/portal", request.nextUrl));
      }

      // Non-admins are blocked from admin-only portal areas.
      if (onPortal && session && session.user.role !== "admin") {
        const adminOnlyPrefixes = [
          "/portal/projects",
          "/portal/maintenance",
          "/portal/suppliers",
          "/portal/departments",
          "/portal/storage-locations",
          "/portal/reports",
          "/portal/users",
        ];
        if (adminOnlyPrefixes.some((p) => path === p || path.startsWith(`${p}/`))) {
          return Response.redirect(new URL("/portal", request.nextUrl));
        }
      }

      return true;
    },
  },
});
