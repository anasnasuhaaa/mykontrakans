"use server";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { hashToken, SESSION_COOKIE } from "@/lib/auth/tokens";
import { loginSchema } from "@/lib/validators/auth";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const input = loginSchema.parse(Object.fromEntries(formData));
    const db = getDb();
    const key = `login:${hashToken(input.email)}`;
    const now = new Date();
    await db.authAttempt.deleteMany({ where: { key, expiresAt: { lte: now } } });
    const attempt = await db.authAttempt.upsert({
      where: { key },
      create: { key, expiresAt: new Date(now.getTime() + 15 * 60000) },
      update: { count: { increment: 1 } },
    });
    if (attempt.count > 10) throw new BusinessError("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
    const user = await db.user.findUnique({ where: { email: input.email } });
    // Always perform a bcrypt comparison, including for unknown accounts.
    const valid = await compare(input.password, user?.passwordHash || "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW");
    if (!valid || !user?.isActive || !user.activatedAt) throw new BusinessError("Email atau password salah, atau akun belum aktif.");
    await createSession(user.id);
    await db.authAttempt.deleteMany({ where: { key } });
  } catch (error) {
    return actionError(error);
  }
  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getDb().session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
