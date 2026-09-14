import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getDb } from "@/lib/db";
import { createToken, hashToken, SESSION_COOKIE } from "./tokens";

export const publicUserSelect = { id: true, name: true, email: true, avatarUrl: true, role: true, isActive: true, activatedAt: true } as const;

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await getDb().session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: publicUserSelect } },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive || !session.user.activatedAt) return null;
  return session.user;
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function createSession(userId: string) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await getDb().session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const financeRoles: UserRole[] = ["ADMIN", "TREASURER"];
export const roleLabels = { ADMIN: "Admin", TREASURER: "Bendahara", MEMBER: "Anggota" };
