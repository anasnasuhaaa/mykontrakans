"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { memberSchema, onboardingSchema } from "@/lib/validators/members";
import { inviteMember } from "@/lib/invitations";

export async function saveMember(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  try {
    const input = memberSchema.parse(Object.fromEntries(form));
    const id = z.string().max(100).parse(form.get("id") || "");
    const db = getDb();
    const member = await db.$transaction(async (tx) => {
      const previous = id ? await tx.user.findUnique({ where: { id } }) : null;
      if (id && !previous) throw new BusinessError("Anggota tidak ditemukan.");
      if (previous?.id === actor.id && input.role !== "ADMIN") throw new BusinessError("Admin tidak dapat mengubah role sendiri.");
      if (previous?.role === "ADMIN" && previous.isActive && previous.activatedAt && input.role !== "ADMIN") {
        const count = await tx.user.count({ where: { role: "ADMIN", isActive: true, activatedAt: { not: null } } });
        if (count <= 1) throw new BusinessError("Minimal satu Admin aktif harus dipertahankan.");
      }
      const member = id ? await tx.user.update({ where: { id }, data: input }) : await tx.user.create({ data: input });
      if (previous && (previous.email !== input.email || previous.role !== input.role)) {
        await tx.session.deleteMany({ where: { userId: id } });
        await tx.onboardingToken.deleteMany({ where: { userId: id } });
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: id ? "MEMBER_UPDATED" : "MEMBER_CREATED", entityType: "User", entityId: member.id, metadata: { role: input.role } } });
      return member;
    }, { isolationLevel: "Serializable" });
    let details: string[] | undefined;
    if (!id) {
      try { details = [await inviteMember(member.id, actor.id)]; }
      catch { details = ["Akun dibuat, tetapi undangan gagal. Silakan kirim ulang."]; }
    }
    revalidatePath("/members");
    return { success: true, message: id ? "Anggota diperbarui." : "Anggota ditambahkan.", details };
  } catch (error) { return actionError(error); }
}

export async function toggleMember(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  try {
    const id = z.string().min(1).parse(form.get("id"));
    if (id === actor.id) throw new BusinessError("Tidak dapat menonaktifkan akun sendiri.");
    const isNowActive = await getDb().$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id } });
      if (user.role === "ADMIN" && user.isActive && user.activatedAt) {
        const count = await tx.user.count({ where: { role: "ADMIN", isActive: true, activatedAt: { not: null } } });
        if (count <= 1) throw new BusinessError("Minimal satu Admin aktif harus dipertahankan.");
      }
      await tx.user.update({ where: { id }, data: { isActive: !user.isActive } });
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.onboardingToken.deleteMany({ where: { userId: id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "MEMBER_STATUS_CHANGED", entityType: "User", entityId: id } });
      return !user.isActive;
    }, { isolationLevel: "Serializable" });
    revalidatePath("/members");
    return { success: true, message: isNowActive ? "Akun anggota diaktifkan kembali." : "Akun anggota dinonaktifkan sementara." };
  } catch (error) { return actionError(error); }
}

export async function deleteMember(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  try {
    const id = z.string().min(1).max(100).parse(form.get("id"));
    if (id === actor.id) throw new BusinessError("Admin tidak dapat menghapus akun sendiri.");

    const deletedName = await getDb().$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) throw new BusinessError("Anggota tidak ditemukan.");

      if (user.role === "ADMIN" && user.isActive && user.activatedAt) {
        const activeAdminCount = await tx.user.count({
          where: { role: "ADMIN", isActive: true, activatedAt: { not: null } },
        });
        if (activeAdminCount <= 1) throw new BusinessError("Admin aktif terakhir tidak dapat dihapus.");
      }

      const ownedBills = await tx.memberBill.findMany({
        where: { memberId: id },
        select: { id: true },
      });
      const ownedBillIds = ownedBills.map((bill) => bill.id);
      const ownedSubmissions = await tx.paymentSubmission.findMany({
        where: { billId: { in: ownedBillIds } },
        select: { id: true },
      });
      const submissionIds = ownedSubmissions.map((submission) => submission.id);
      if (submissionIds.length > 0) {
        await tx.transaction.deleteMany({ where: { relatedPaymentId: { in: submissionIds } } });
      }

      await tx.paymentSubmission.updateMany({ where: { reviewerId: id }, data: { reviewerId: null } });
      if (submissionIds.length > 0) {
        await tx.paymentSubmission.deleteMany({ where: { id: { in: submissionIds } } });
      }
      await tx.memberBill.deleteMany({ where: { memberId: id } });

      // Preserve submissions the user uploaded on behalf of somebody else.
      await tx.paymentSubmission.updateMany({ where: { memberId: id }, data: { memberId: actor.id } });

      // Keep shared bookkeeping intact when the deleted user created financial records.
      await tx.transaction.updateMany({ where: { createdById: id }, data: { createdById: actor.id } });
      await tx.billingPeriod.updateMany({ where: { createdById: id }, data: { createdById: actor.id } });

      await tx.session.deleteMany({ where: { userId: id } });
      await tx.onboardingToken.deleteMany({ where: { userId: id } });
      await tx.authAttempt.deleteMany({ where: { key: `login:${hashToken(user.email)}` } });
      await tx.auditLog.deleteMany({ where: { actorId: id } });
      await tx.user.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "MEMBER_DELETED",
          entityType: "User",
          entityId: id,
          metadata: { memberName: user.name },
        },
      });
      return user.name;
    }, { isolationLevel: "Serializable" });

    revalidatePath("/members");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    revalidatePath("/payments/review");
    revalidatePath("/transactions");
    revalidatePath("/history");
    return { success: true, message: `${deletedName} telah dihapus permanen.` };
  } catch (error) { return actionError(error); }
}

export async function sendInvitations(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  try {
    const ids = z.array(z.string().min(1).max(100)).min(1, "Pilih anggota terlebih dahulu.").max(50).parse(form.getAll("ids"));
    const details = [];
    for (const id of [...new Set(ids)]) {
      try { details.push(await inviteMember(id, actor.id)); }
      catch { details.push("Satu undangan gagal diproses. Silakan coba lagi."); }
    }
    return { success: !details.some((item) => /gagal|invalid/.test(item)), message: "Pengiriman undangan selesai. Lihat hasil per anggota.", details };
  } catch (error) { return actionError(error); }
}

export async function activateAccount(_state: ActionState, form: FormData): Promise<ActionState> {
  try {
    const input = onboardingSchema.parse(Object.fromEntries(form));
    const tokenHash = hashToken(input.token);
    const db = getDb();
    const token = await db.onboardingToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!token || token.expiresAt <= new Date() || !token.user.isActive || token.user.activatedAt) throw new BusinessError("Link tidak valid atau sudah kedaluwarsa. Minta undangan baru kepada Admin.");
    const passwordHash = await hash(input.password, 12);
    await db.$transaction(async (tx) => {
      const consumed = await tx.onboardingToken.deleteMany({ where: { id: token.id, tokenHash, expiresAt: { gt: new Date() } } });
      if (consumed.count !== 1) throw new BusinessError("Link sudah digunakan atau kedaluwarsa.");
      const updated = await tx.user.updateMany({ where: { id: token.userId, isActive: true, activatedAt: null }, data: { passwordHash, activatedAt: new Date() } });
      if (updated.count !== 1) throw new BusinessError("Akun tidak dapat diaktifkan.");
      await tx.auditLog.create({ data: { actorId: token.userId, action: "ACCOUNT_ACTIVATED", entityType: "User", entityId: token.userId } });
    });
  } catch (error) { return actionError(error); }
  redirect("/login?toast=activated");
}
