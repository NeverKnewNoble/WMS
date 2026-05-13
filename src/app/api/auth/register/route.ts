import { NextResponse } from "next/server";
import { hash as argonHash } from "@node-rs/argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(["admin", "storekeeper"]),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = schema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { fullName, email, password, role: roleCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) {
    return NextResponse.json(
      { error: "Roles are not seeded. Run `prisma db seed`." },
      { status: 500 },
    );
  }

  const passwordHash = await argonHash(password);

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      roleId: role.id,
      status: "active",
    },
    select: { id: true, email: true, fullName: true },
  });

  return NextResponse.json({
    id: user.id.toString(),
    email: user.email,
    fullName: user.fullName,
  });
}
