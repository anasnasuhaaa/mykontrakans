"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser, financeRoles } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { actionError, BusinessError, type ActionState } from "@/lib/actions";
import { getJakartaDate } from "@/lib/dates";

const generateSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export async function generateBillingPeriod(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);
  try {
    const rawYear = form.get("year");
    const rawMonth = form.get("month");
    const nowJkt = getJakartaDate();
    const year = rawYear ? generateSchema.shape.year.parse(rawYear) : nowJkt.getFullYear();
    const month = rawMonth ? generateSchema.shape.month.parse(rawMonth) : nowJkt.getMonth() + 1;
    const memberIds = [...new Set(z.array(z.string().min(1).max(100))
      .min(1, "Pilih minimal satu anggota yang perlu membayar.").max(500)
      .parse(form.getAll("memberIds")))];

    const db = getDb();
    const settings = (await db.appSetting.findUnique({ where: { id: "default" } })) || {
      monthlyDuesAmount: 100000,
      monthlyDueDay: 10,
    };

    // Calculate due date in Asia/Jakarta clamped to last day of month
    const daysInMonth = new Date(year, month, 0).getDate();
    const clampedDay = Math.min(settings.monthlyDueDay, daysInMonth);
    const dueDate = new Date(Date.UTC(year, month - 1, clampedDay, 12, 0, 0));

    await db.$transaction(async (tx) => {
      const existing = await tx.billingPeriod.findUnique({
        where: { year_month: { year, month } },
      });
      if (existing) {
        throw new BusinessError(`Tagihan untuk periode ${month}/${year} sudah pernah dibuat.`);
      }

      const activeMembers = await tx.user.findMany({
        where: { id: { in: memberIds }, isActive: true, role: { not: "ADMIN" } },
        select: { id: true },
      });

      if (activeMembers.length !== memberIds.length) {
        throw new BusinessError("Pilihan anggota berubah atau tidak valid. Muat ulang dan pilih anggota aktif kembali.");
      }

      const period = await tx.billingPeriod.create({
        data: {
          year,
          month,
          dueDate,
          amountPerMember: settings.monthlyDuesAmount,
          createdById: actor.id,
          bills: {
            create: activeMembers.map((member) => ({
              memberId: member.id,
              amount: settings.monthlyDuesAmount,
              status: "UNPAID",
            })),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "BILLING_PERIOD_GENERATED",
          entityType: "BillingPeriod",
          entityId: period.id,
          metadata: { year, month, memberCount: activeMembers.length, memberIds },
        },
      });
    }, { isolationLevel: "Serializable" });

    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return { success: true, message: `Tagihan periode ${month}/${year} berhasil dibuat.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteBillingPeriod(_state: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requireUser(financeRoles);

  try {
    const periodId = z.string().min(1, "ID periode tidak ditemukan.").max(100).parse(form.get("periodId"));
    const deletedPeriod = await getDb().$transaction(async (tx) => {
      const period = await tx.billingPeriod.findUnique({
        where: { id: periodId },
        include: {
          bills: {
            select: {
              status: true,
              _count: { select: { submissions: true } },
            },
          },
        },
      });

      if (!period) throw new BusinessError("Periode tagihan tidak ditemukan.");

      const hasPaymentActivity = period.bills.some(
        (bill) => bill.status !== "UNPAID" || bill._count.submissions > 0,
      );
      if (hasPaymentActivity) {
        throw new BusinessError("Periode tidak dapat dihapus karena sudah memiliki aktivitas pembayaran.");
      }

      await tx.memberBill.deleteMany({ where: { billingPeriodId: period.id } });
      await tx.billingPeriod.delete({ where: { id: period.id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "BILLING_PERIOD_DELETED",
          entityType: "BillingPeriod",
          entityId: period.id,
          metadata: { year: period.year, month: period.month, billCount: period.bills.length },
        },
      });

      return { year: period.year, month: period.month };
    }, { isolationLevel: "Serializable" });

    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return {
      success: true,
      message: `Periode tagihan ${deletedPeriod.month}/${deletedPeriod.year} berhasil dihapus.`,
    };
  } catch (error) {
    return actionError(error);
  }
}
