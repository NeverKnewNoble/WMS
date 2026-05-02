import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function initialsFor(name: string | null | undefined): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  const first = parts[0]?.[0] ?? "";
  const last  = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Reads the JWT session and returns the minimal user shape the sidebar needs. */
export async function getSessionUserOrRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/** Full user record from the database, joined with role + department labels. */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.user.id) },
    include: {
      role:        true,
      department:  true,
      defaultSite: true,
    },
  });

  if (!user) redirect("/auth/login");

  return user;
}
