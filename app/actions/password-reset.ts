"use server";

import { hash } from "bcryptjs";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { createToken, hashToken, SESSION_COOKIE } from "@/lib/auth/tokens";
import { emailSchema, resetPasswordSchema } from "@/lib/validators/auth";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";

const requestMessage = "Jika email tersebut terdaftar dan akun aktif, tautan reset password akan dikirim. Periksa kotak masuk atau folder spam.";
const invalidTokenMessage = "Tautan reset password tidak valid atau sudah kedaluwarsa. Minta tautan baru.";

export async function requestPasswordReset(_state: ActionState, form: FormData): Promise<ActionState> {
  try {
    const email = emailSchema.parse(form.get("email"));
    const db = getDb();
    const key = `password-reset:${hashToken(email)}`;
    const now = new Date();
    await db.authAttempt.deleteMany({ where: { key, expiresAt: { lte: now } } });
    const attempt = await db.authAttempt.upsert({
      where: { key }, create: { key, expiresAt: new Date(now.getTime() + 15 * 60000) },
      update: { count: { increment: 1 } },
    });
    if (attempt.count > 3) return { success: true, message: requestMessage };
    const token = createToken();
    const tokenHash = hashToken(token);
    const user = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });
      if (!user?.isActive || !user.activatedAt || !user.passwordHash) return null;
      await tx.passwordResetToken.upsert({
        where: { userId: user.id },
        create: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + 30 * 60000) },
        update: { tokenHash, expiresAt: new Date(now.getTime() + 30 * 60000) },
      });
      return user;
    }, { isolationLevel: "Serializable" });
    if (user) {
      try {
        await sendEmail({
          to: user.email, name: user.name, subject: "Reset Password MyKontrakans",
          message: "Gunakan tautan di bawah untuk membuat password baru. Tautan berlaku selama 30 menit dan hanya dapat digunakan sekali. Jika Anda tidak meminta reset password, abaikan email ini; password Anda tetap sama.",
          link: `${getServerEnv().NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`, button: "Buat password baru",
        });
      } catch {
        await db.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
        console.error("Password reset email delivery failed.");
      }
    }
    return { success: true, message: requestMessage };
  } catch (error) {
    return actionError(error);
  }
}

export async function resetPassword(_state: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = resetPasswordSchema.parse(Object.fromEntries(form));
    const tokenHash = hashToken(input.token);
    const db = getDb();
    const pending = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!pending || pending.expiresAt <= new Date()) throw new BusinessError(invalidTokenMessage);
    const passwordHash = await hash(input.password, 12);
    await db.$transaction(async (tx) => {
      const record = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
      if (!record || record.expiresAt <= new Date() || !record.user.isActive || !record.user.activatedAt) {
        throw new BusinessError(invalidTokenMessage);
      }
      const consumed = await tx.passwordResetToken.deleteMany({ where: { tokenHash, expiresAt: { gt: new Date() } } });
      if (consumed.count !== 1) throw new BusinessError(invalidTokenMessage);
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: record.userId } });
      await tx.authAttempt.deleteMany({ where: { key: `login:${hashToken(record.user.email)}` } });
      await tx.auditLog.create({ data: { actorId: record.userId, action: "PASSWORD_RESET", entityType: "User", entityId: record.userId } });
    }, { isolationLevel: "Serializable" });
    (await cookies()).delete(SESSION_COOKIE);
    return { success: true, message: "Password berhasil diperbarui. Silakan masuk dengan password baru. Semua sesi sebelumnya telah diakhiri." };
  } catch (error) {
    return actionError(error);
  }
}
