import "server-only";
import { getDb } from "@/lib/db";
import { createToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { emailSchema } from "@/lib/validators/auth";

export async function inviteMember(userId: string, actorId: string) {
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return "Anggota tidak ditemukan atau dinonaktifkan";
  if (!emailSchema.safeParse(user.email).success) return `${user.name}: email invalid`;
  if (user.activatedAt) return `${user.name}: sudah aktif`;
  const token = createToken();
  const tokenHash = hashToken(token);
  await db.$transaction(async (tx) => {
    await tx.onboardingToken.upsert({
      where: { userId },
      create: { userId, tokenHash, expiresAt: new Date(Date.now() + 86400000) },
      update: { tokenHash, expiresAt: new Date(Date.now() + 86400000) },
    });
    await tx.auditLog.create({ data: { actorId, action: "MEMBER_INVITED", entityType: "User", entityId: userId } });
  });
  try {
    await sendEmail({ to: user.email, name: user.name, subject: "Undangan MyKontrakans", message: "Kamu telah ditambahkan ke kontrakan. Buat password untuk mengaktifkan akunmu.\nLink ini berlaku selama 24 jam dan hanya dapat digunakan sekali. Jika kamu tidak mengenali undangan ini, abaikan email ini.", link: `${getServerEnv().NEXT_PUBLIC_APP_URL}/onboarding?token=${token}`, button: "Aktifkan akun" });
    return `${user.name}: berhasil terkirim`;
  } catch {
    await db.onboardingToken.deleteMany({ where: { userId, tokenHash } });
    return `${user.name}: gagal terkirim. Periksa konfigurasi email dan kirim ulang.`;
  }
}
