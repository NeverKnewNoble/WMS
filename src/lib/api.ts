import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import type { z } from "zod";

// ─── Auth guard ─────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new HttpError(401, "Not authenticated");
  }
  return {
    id: BigInt(session.user.id),
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    departmentId: session.user.departmentId
      ? BigInt(session.user.departmentId)
      : null,
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new HttpError(403, "Admins only");
  }
  return user;
}

// ─── Serialization ──────────────────────────────────────────────────

/**
 * Walk a value tree converting Prisma's BigInt → string and Decimal → number.
 * BigInt as string keeps IDs safe across JSON boundaries; Decimal as number
 * is fine for the magnitudes we deal with (stock counts, currency in cedis
 * up to 14 digits).
 */
export function serialize<T>(value: T): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out;
  }
  return value;
}

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(serialize(data), init);
}

export function jsonError(message: string, status = 400, extra?: object) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

// ─── Body / param parsing ───────────────────────────────────────────

export async function parseJson<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Validation failed");
  }
  return parsed.data;
}

export function parseBigIntId(id: string | undefined): bigint {
  if (!id) throw new HttpError(400, "Missing id");
  try {
    const v = BigInt(id);
    if (v <= 0n) throw new Error();
    return v;
  } catch {
    throw new HttpError(400, "Invalid id");
  }
}

// ─── Wrapper that turns thrown HttpErrors into JSON responses ───────

export function withApi(
  handler: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>,
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return jsonError(err.message, err.status);
      }
      console.error("API error:", err);
      return jsonError("Internal server error", 500);
    }
  };
}

// ─── Pagination ─────────────────────────────────────────────────────

export function readPagination(url: URL, defaults = { limit: 50, max: 200 }) {
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? defaults.limit) || defaults.limit, 1),
    defaults.max,
  );
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);
  return { limit, offset };
}
